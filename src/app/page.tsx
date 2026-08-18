"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import TileCard from "@/components/TileCard";

import { Soundable } from "@/app/ui/Soundable";
import { useUiSounds } from "@/app/ui/useUiSounds";

type SoundPref = "enabled" | "disabled" | null;

type Scene = "home" | "projects" | "tools" | "about" | "contact" | `projects/${string}`;
type Phase = "idle" | "out" | "swap" | "in";

const FADE_OUT_MS = 420;
const FADE_IN_MS = 560;

// "Zip" distance: how far scenes start from before sliding up into place.
const ZIP_Y_PX = 90;

// Optional: delay grids so header arrives first, then cards zip up.
const GRID_DELAY_MS = 130;

function isProjectDetailScene(scene: Scene): scene is `projects/${string}` {
  return scene.startsWith("projects/");
}

function projectSlugFromScene(scene: Scene): string | null {
  if (!isProjectDetailScene(scene)) return null;
  const slug = scene.slice("projects/".length).trim();
  return slug.length ? slug : null;
}

function sceneFromHash(hash: string): Scene {
  const raw = (hash || "").replace("#", "").trim();
  const h = raw.toLowerCase();

  if (h === "projects") return "projects";
  if (h.startsWith("projects/")) {
    const slug = raw.slice("projects/".length).trim();
    return (`projects/${slug}` as const) as Scene;
  }

  if (h === "tools") return "tools";
  if (h === "about") return "about";
  if (h === "contact") return "contact";
  return "home";
}

function hashForScene(scene: Scene) {
  return scene === "home" ? "" : `#${scene}`;
}

// Force a real paint boundary so opacity 0 -> 1 actually animates (no snap)
function afterNextPaint(cb: () => void) {
  requestAnimationFrame(() => requestAnimationFrame(cb));
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const t = window.setTimeout(() => resolve(null), ms);
    p.then((v) => {
      window.clearTimeout(t);
      resolve(v);
    }).catch(() => {
      window.clearTimeout(t);
      resolve(null);
    });
  });
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  const [pref, setPref] = useState<SoundPref>(null);
  const [soundActive, setSoundActive] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const [activeScene, setActiveScene] = useState<Scene>("home");

  // Transition state
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<Phase>("out"); // start hidden -> fade in on mount

  // Transition timers
  const outTimer = useRef<number | null>(null);
  const inTimer = useRef<number | null>(null);

  // Target scene (for rapid clicks / hash changes)
  const targetSceneRef = useRef<Scene>("home");

  // Asset decode promise (stone mask + icons)
  const assetsReadyRef = useRef<Promise<void> | null>(null);

  function clearTimers() {
    if (outTimer.current !== null) {
      window.clearTimeout(outTimer.current);
      outTimer.current = null;
    }
    if (inTimer.current !== null) {
      window.clearTimeout(inTimer.current);
      inTimer.current = null;
    }
  }

  function ensureAssetsReady() {
    if (assetsReadyRef.current) return assetsReadyRef.current;

    const urls = [
      "/Backgrounds/TileCards/stone-face.png",
      "/Icons/projects2.png",
      "/Icons/tools2.png",
    ];

    assetsReadyRef.current = new Promise<void>((resolve) => {
      let remaining = urls.length;

      const done = () => {
        remaining -= 1;
        if (remaining <= 0) resolve();
      };

      urls.forEach((src) => {
        const img = new Image();
        img.src = src;

        // decode helps avoid "pop in" on first use as masks/backgrounds
        if (img.decode) {
          img.decode().then(done).catch(done);
        } else {
          img.onload = () => done();
          img.onerror = () => done();
        }
      });
    });

    return assetsReadyRef.current;
  }

  function goTo(next: Scene, updateHash: boolean) {
    targetSceneRef.current = next;

    if (updateHash && typeof window !== "undefined") {
      const h = hashForScene(next);
      if (window.location.hash !== h) window.location.hash = h;
    }

    if (phase === "idle" && activeScene === next) return;
    if (phase !== "idle") return;

    clearTimers();

    setPhase("out");
    setVisible(false);

    outTimer.current = window.setTimeout(() => {
      setActiveScene(targetSceneRef.current);
      setPhase("swap");
    }, FADE_OUT_MS);
  }

  // Scene wrapper style:
  // We keep a single visible scene (your original structure), but we make the hidden phase
  // start from further down (ZIP_Y_PX) for a stronger "zip up" effect.
  function sceneWrapperStyle() {
    const opacity = visible ? 1 : 0;
    const y = visible ? 0 : ZIP_Y_PX;
    const blur = visible ? 0 : 1.25;
    const duration = visible ? FADE_IN_MS : FADE_OUT_MS;

    return {
      opacity,
      transform: `translateY(${y}px)`,
      filter: `blur(${blur}px)`,
      transitionProperty: "opacity, transform, filter",
      transitionDuration: `${duration}ms`,
      transitionTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      willChange: "opacity, transform, filter",
      pointerEvents: phase !== "idle" ? ("none" as const) : ("auto" as const),
    };
  }

  // Grid style: stagger so header comes in first, then cards zip in (intentional, not "pop").
  function gridStyle() {
    const gridVisible = visible && phase !== "out";
    const opacity = gridVisible ? 1 : 0;
    const y = gridVisible ? 0 : ZIP_Y_PX;
    const duration = gridVisible ? FADE_IN_MS : FADE_OUT_MS;
    const delay = gridVisible ? `${GRID_DELAY_MS}ms` : "0ms";

    return {
      opacity,
      transform: `translateY(${y}px)`,
      transitionProperty: "opacity, transform",
      transitionDuration: `${duration}ms`,
      transitionTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      transitionDelay: delay,
      willChange: "opacity, transform",
    };
  }

  // Mount + initial scene
  useEffect(() => {
    setMounted(true);
    setShowHint(true);

    try {
      const v = localStorage.getItem("ui:sound");
      if (v === "enabled" || v === "disabled") setPref(v);
      else setPref(null);
    } catch {
      setPref(null);
    }

    setSoundActive(false);

    // Warm up assets immediately
    ensureAssetsReady();

    const initial = sceneFromHash(typeof window !== "undefined" ? window.location.hash : "");
    targetSceneRef.current = initial;
    setActiveScene(initial);

    // Start hidden then fade in once we have at least a paint boundary.
    setPhase("in");
    setVisible(false);

    afterNextPaint(() => {
      setVisible(true);
      inTimer.current = window.setTimeout(() => {
        setPhase("idle");
        clearTimers();
      }, FADE_IN_MS);
    });

    return () => {
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hash navigation listener (stable)
  useEffect(() => {
    const onHashChange = () => {
      const next = sceneFromHash(window.location.hash);
      goTo(next, false);
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, activeScene]);

  // Hide scrollbars (keep scrolling)
  useEffect(() => {
    document.documentElement.style.scrollbarWidth = "none";
    (document.documentElement.style as any).msOverflowStyle = "none";

    const style = document.createElement("style");
    style.setAttribute("data-hide-scrollbar", "true");
    style.textContent = `
      html::-webkit-scrollbar { width: 0px; height: 0px; }
      body::-webkit-scrollbar { width: 0px; height: 0px; }
    `;
    document.head.appendChild(style);

    return () => {
      document.documentElement.style.scrollbarWidth = "";
      (document.documentElement.style as any).msOverflowStyle = "";
      const el = document.querySelector('style[data-hide-scrollbar="true"]');
      if (el && el.parentNode) el.parentNode.removeChild(el);
    };
  }, []);

  // Fade-in only AFTER swap commit + assets ready (or timeout)
  useLayoutEffect(() => {
    if (phase !== "swap") return;

    clearTimers();

    const p = ensureAssetsReady();
    void withTimeout(p, 900).then(() => {
      afterNextPaint(() => {
        setPhase("in");
        setVisible(true);

        inTimer.current = window.setTimeout(() => {
          setPhase("idle");
          clearTimers();

          const t = targetSceneRef.current;
          if (t !== activeScene) {
            goTo(t, false);
          }
        }, FADE_IN_MS);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, activeScene]);

  const soundEnabled = soundActive;

  const { play, unlock } = useUiSounds(
    {
      hoverSrc: "/sfx/card-hover.wav",
      clickSrc: "/sfx/card-click.wav",
      hoverVolume: 0.22,
      clickVolume: 0.28,
    },
    soundEnabled
  );

  const showSoundHint = mounted && showHint;

  const dismissHint = () => {
    setSoundActive(false);
    setShowHint(false);

    try {
      localStorage.setItem("ui:sound", "disabled");
    } catch {}
    setPref("disabled");
  };

  const onToggleSound = async () => {
    setShowHint(false);

    if (!soundActive) {
      const ok = await unlock();
      if (ok) {
        setSoundActive(true);
        try {
          localStorage.setItem("ui:sound", "enabled");
        } catch {}
        setPref("enabled");
      } else {
        setSoundActive(false);
        try {
          localStorage.setItem("ui:sound", "disabled");
        } catch {}
        setPref("disabled");
      }
      return;
    }

    setSoundActive(false);
    try {
      localStorage.setItem("ui:sound", "disabled");
    } catch {}
    setPref("disabled");
  };

  const projects = useMemo(
    () => [
      {
        slug: "the-day-god-ordered-pizza",
        title: "The Day God Ordered Pizza",
        description: "A charasmatic puzzle adventure",
        iconSrc: "/Icons/HustlaMoon.png",
      },
      {
        slug: "the-day-god-ordered-pizza-api",
        title: "The Day God Ordered Pizza API",
        description: "A demonstration of the API for The Day God Ordered Pizza",
        iconSrc: "/Icons/HustlaMoon.png",
      },
      {
        slug: "mandelbrot-shader",
        title: "Mandelbrot Shader",
        description: "A demonstration of a Mandelbrot Shader",
        iconSrc: "/Icons/mandelbrot-circle.png",
      },
      {
        slug: "boids-system",
        title: "Boids System",
        description: "A demonstration of boids and schools of fish.",
        iconSrc: "/Icons/Boids-Circle.png",
      },
    ],
    []
  );

  const tools = useMemo(
    () => [
      {
        title: "Selenium WebDriver Extensions",
        description: "Helpers for locating elements across weird DOMs.",
        iconSrc: "/Icons/tools2.png",
      },
      {
        title: "Automation Utilities",
        description: "Small tooling that removes friction from workflows.",
        iconSrc: "/Icons/tools2.png",
      },
      {
        title: "Editor Productivity",
        description: "Quality-of-life scripts, launchers, and shortcuts.",
        iconSrc: "/Icons/tools2.png",
      },
    ],
    []
  );

  const activeProject = useMemo(() => {
    const slug = projectSlugFromScene(activeScene);
    if (!slug) return null;
    return projects.find((p) => p.slug.toLowerCase() === slug.toLowerCase()) ?? null;
  }, [activeScene, projects]);

  return (
    <div className="relative z-10 min-h-screen text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.10),_transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(255,255,255,0.04),_transparent_60%)]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <Navbar
          soundEnabled={soundEnabled}
          onToggleSound={onToggleSound}
          showSoundHint={showSoundHint}
          dismissHint={dismissHint}
        />

        {/* Visible content */}
        <div style={sceneWrapperStyle()}>
          {activeScene === "home" && (
            <>
              <header className="pb-6 pt-28 text-center">
                <h1 className="text-6xl font-semibold tracking-tight md:text-7xl">Peter Murphy</h1>

                <p className="mt-4 text-lg text-zinc-400">
                  Software Engineer - Game Developer - Tool Builder
                </p>

                <p className="mt-2 text-sm text-zinc-500">I build systems, tools, and worlds.</p>
              </header>

              <section className="mt-16 pb-24">
                <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-8 md:grid-cols-2">
                  <Soundable onHoverSound={() => play("hover")} onClickSound={() => play("click")}>
                    <TileCard
                      title="Projects"
                      description="Selected work, experiments, and shipped systems."
                      iconSrc="/Icons/projects2.png"
                      iconAlt="Projects"
                      href="#projects"
                      onClick={() => goTo("projects", true)}
                    />
                  </Soundable>

                  <Soundable onHoverSound={() => play("hover")} onClickSound={() => play("click")}>
                    <TileCard
                      title="Tools"
                      description="Developer tools, utilities, and automation."
                      iconSrc="/Icons/tools2.png"
                      iconAlt="Tools"
                      href="#tools"
                      onClick={() => goTo("tools", true)}
                    />
                  </Soundable>
                </div>
              </section>
            </>
          )}

          {activeScene === "projects" && (
            <>
              <header className="pb-6 pt-28 text-center">
                <h2 className="text-5xl font-semibold tracking-tight md:text-6xl">Projects</h2>
                <p className="mt-3 text-sm text-zinc-500">
                  Selected work, experiments, and shipped systems.
                </p>

                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() => goTo("home", true)}
                    className="rounded-full border border-white/10 bg-black/30 px-5 py-2 text-sm text-white/80 backdrop-blur-sm transition hover:border-white/20 hover:bg-black/40"
                  >
                    Back
                  </button>
                </div>
              </header>

              <section className="mt-10 pb-24" style={gridStyle()}>
                <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-8 md:grid-cols-2">
                  {projects.map((p) => (
                    <Soundable
                      key={p.slug}
                      onHoverSound={() => play("hover")}
                      onClickSound={() => play("click")}
                    >
                      <TileCard
                        title={p.title}
                        description={p.description}
                        iconSrc={p.iconSrc}
                        iconAlt={p.title}
                        href={`#projects/${p.slug}`}
                        onClick={() => goTo(`projects/${p.slug}`, true)}
                      />
                    </Soundable>
                  ))}
                </div>
              </section>
            </>
          )}

          {isProjectDetailScene(activeScene) && (
            <>
              <header className="pb-6 pt-28 text-center">
                <h2 className="text-5xl font-semibold tracking-tight md:text-6xl">
                  {activeProject?.title ?? "Project"}
                </h2>

                <p className="mt-3 text-sm text-zinc-500">
                  {activeProject?.description ?? "Project details."}
                </p>

                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() => goTo("projects", true)}
                    className="rounded-full border border-white/10 bg-black/30 px-5 py-2 text-sm text-white/80 backdrop-blur-sm transition hover:border-white/20 hover:bg-black/40"
                  >
                    Back
                  </button>
                </div>
              </header>

              <section className="mx-auto mt-10 max-w-[980px] pb-24" style={gridStyle()}>
                <div className="rounded-2xl border border-white/10 bg-black/25 p-8 text-white/80 backdrop-blur-sm">
                  {!activeProject ? (
                    <p className="leading-relaxed">Couldn’t find that project.</p>
                  ) : (
                    <>
                      <p className="leading-relaxed">
                        Replace this with real content for{" "}
                        <span className="text-white/90">{activeProject.title}</span>.
                      </p>

                      <div className="mt-6 space-y-3 text-sm text-zinc-300">
                        <p>
                          <span className="text-white/70">Slug:</span> {activeProject.slug}
                        </p>
                        <p>
                          <span className="text-white/70">Next step:</span> add screenshots, stack,
                          features, links, etc.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </section>
            </>
          )}

          {activeScene === "tools" && (
            <>
              <header className="pb-6 pt-28 text-center">
                <h2 className="text-5xl font-semibold tracking-tight md:text-6xl">Tools</h2>
                <p className="mt-3 text-sm text-zinc-500">
                  Developer tools, utilities, and automation.
                </p>

                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() => goTo("home", true)}
                    className="rounded-full border border-white/10 bg-black/30 px-5 py-2 text-sm text-white/80 backdrop-blur-sm transition hover:border-white/20 hover:bg-black/40"
                  >
                    Back
                  </button>
                </div>
              </header>

              <section className="mt-10 pb-24" style={gridStyle()}>
                <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-8 md:grid-cols-2">
                  {tools.map((t) => (
                    <Soundable
                      key={t.title}
                      onHoverSound={() => play("hover")}
                      onClickSound={() => play("click")}
                    >
                      <TileCard
                        title={t.title}
                        description={t.description}
                        iconSrc={t.iconSrc}
                        iconAlt={t.title}
                        href="#"
                        onClick={() => {}}
                      />
                    </Soundable>
                  ))}
                </div>
              </section>
            </>
          )}

          {activeScene === "about" && (
            <>
              <header className="pb-6 pt-28 text-center">
                <h2 className="text-5xl font-semibold tracking-tight md:text-6xl">About</h2>
                <p className="mt-3 text-sm text-zinc-500">Drop your About content in here.</p>

                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() => goTo("home", true)}
                    className="rounded-full border border-white/10 bg-black/30 px-5 py-2 text-sm text-white/80 backdrop-blur-sm transition hover:border-white/20 hover:bg-black/40"
                  >
                    Back
                  </button>
                </div>
              </header>

              <section className="mx-auto mt-10 max-w-[980px] pb-24" style={gridStyle()}>
                <div className="rounded-2xl border border-white/10 bg-black/25 p-8 text-white/80 backdrop-blur-sm">
                  <p className="leading-relaxed">About content goes here.</p>
                </div>
              </section>
            </>
          )}

          {activeScene === "contact" && (
            <>
              <header className="pb-6 pt-28 text-center">
                <h2 className="text-5xl font-semibold tracking-tight md:text-6xl">Contact</h2>
                <p className="mt-3 text-sm text-zinc-500">Drop your contact details in here.</p>

                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() => goTo("home", true)}
                    className="rounded-full border border-white/10 bg-black/30 px-5 py-2 text-sm text-white/80 backdrop-blur-sm transition hover:border-white/20 hover:bg-black/40"
                  >
                    Back
                  </button>
                </div>
              </header>

              <section className="mx-auto mt-10 max-w-[980px] pb-24" style={gridStyle()}>
                <div className="rounded-2xl border border-white/10 bg-black/25 p-8 text-white/80 backdrop-blur-sm">
                  <p className="leading-relaxed">Contact content goes here.</p>
                </div>
              </section>
            </>
          )}
        </div>

        {/* OFFSCREEN PREWARM
            This forces the heavy masked TileCards to mount + paint once, so the first time
            you navigate to Projects/Tools they don’t “pop” in late.
        */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-[10000px] top-0 opacity-0"
        >
          <div className="w-[1180px]">
            <div className="grid grid-cols-2 gap-8">
              {projects.map((p) => (
                <TileCard
                  key={`prewarm-project-${p.slug}`}
                  title={p.title}
                  description={p.description}
                  iconSrc={p.iconSrc}
                  iconAlt={p.title}
                  href="#"
                  onClick={() => {}}
                />
              ))}
              {tools.map((t) => (
                <TileCard
                  key={`prewarm-tool-${t.title}`}
                  title={t.title}
                  description={t.description}
                  iconSrc={t.iconSrc}
                  iconAlt={t.title}
                  href="#"
                  onClick={() => {}}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
