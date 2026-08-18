"use client";

import { useEffect, useRef, useState } from "react";

type Project = {
  number: string;
  eyebrow: string;
  title: string;
  description: string;
  detail: string;
  tags: string[];
  accent: "blue" | "mint" | "amber";
  featured?: boolean;
};

const projects: Project[] = [
  {
    number: "01",
    eyebrow: "Production software · 2026",
    title: "Daydrop",
    description: "Leave and payroll software built around the way a real office actually works.",
    detail:
      "I designed and delivered the full internal system—from employee requests and approval workflows to live notifications, payroll distribution and administrative controls.",
    tags: ["ASP.NET Core", "Razor Pages", "EF Core", "SQLite", "IIS"],
    accent: "blue",
    featured: true,
  },
  {
    number: "02",
    eyebrow: "Game development",
    title: "The Day God Ordered Pizza",
    description: "A character-driven puzzle adventure with an intentionally unusual premise.",
    detail:
      "A complete game project combining interaction design, narrative systems, level logic and API-backed experiments.",
    tags: ["Game systems", "Level design", "API design"],
    accent: "amber",
  },
  {
    number: "03",
    eyebrow: "Interactive graphics",
    title: "Simulations & shaders",
    description: "Small systems that turn mathematical rules into something you can see and explore.",
    detail:
      "Boids, schools of fish and Mandelbrot rendering experiments focused on emergent motion and real-time graphics.",
    tags: ["Boids", "Shaders", "Realtime rendering"],
    accent: "mint",
  },
];

const capabilities = [
  ["01", "Software engineering", "Reliable internal tools and full-stack applications built around real operational needs."],
  ["02", "Test automation", "Framework-level tooling for difficult DOMs, iframes, tables and repeatable test workflows."],
  ["03", "Interactive development", "Games, simulations and visual systems that make technical ideas tangible."],
];

function SignalField() {
  const ref = useRef<HTMLDivElement>(null);

  function move(event: React.PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--pointer-x", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--pointer-y", `${event.clientY - rect.top}px`);
  }

  return (
    <div ref={ref} className="signal-field" onPointerMove={move} aria-hidden="true">
      <div className="signal-glow" />
      <div className="signal-grid" />
      <div className="signal-route route-one" />
      <div className="signal-route route-two" />
      <div className="signal-route route-three" />
      <span className="signal-node node-one"><i /></span>
      <span className="signal-node node-two"><i /></span>
      <span className="signal-node node-three"><i /></span>
      <span className="signal-node node-four"><i /></span>
      <div className="signal-readout">
        <span>System status</span>
        <strong><i /> Building useful things</strong>
      </div>
      <div className="signal-label label-one">PRODUCT</div>
      <div className="signal-label label-two">AUTOMATION</div>
      <div className="signal-label label-three">INTERACTION</div>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const ref = useRef<HTMLElement>(null);

  function move(event: React.PointerEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--card-x", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--card-y", `${event.clientY - rect.top}px`);
  }

  return (
    <article
      ref={ref}
      onPointerMove={move}
      className={`project-card accent-${project.accent}${project.featured ? " project-featured" : ""}`}
    >
      <div className="project-light" aria-hidden="true" />
      <div className="project-topline">
        <span>{project.eyebrow}</span>
        <span>{project.number}</span>
      </div>
      <div className="project-body">
        <div>
          <h3>{project.title}</h3>
          <p className="project-lead">{project.description}</p>
        </div>
        <p className="project-detail">{project.detail}</p>
      </div>
      {project.featured && (
        <div className="daydrop-window" aria-label="Stylised Daydrop interface preview">
          <div className="window-bar"><span /><span /><span /><b>DAYDROP / OVERVIEW</b></div>
          <div className="window-content">
            <div className="mini-sidebar"><b>DD</b><i /><i /><i /><i /></div>
            <div className="mini-main">
              <span className="mini-kicker">GOOD MORNING, PETER</span>
              <strong>Everything in one place.</strong>
              <div className="mini-stats"><i /><i /><i /></div>
              <div className="mini-chart"><span /><span /><span /><span /><span /><span /></div>
            </div>
          </div>
        </div>
      )}
      <div className="tag-row">
        {project.tags.map((tag) => <span key={tag}>{tag}</span>)}
      </div>
      <div className="project-link">Case study in progress <span>↗</span></div>
    </article>
  );
}

export default function HomePage() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const available = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(available > 0 ? window.scrollY / available : 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <main>
      <div className="progress" style={{ transform: `scaleX(${scrollProgress})` }} />
      <nav className="nav shell">
        <a className="wordmark" href="#top" aria-label="Peter Murphy, home">PM<span>.</span></a>
        <div className="nav-links">
          <a href="#work">Work</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </div>
        <a className="nav-cta" href="#contact">Let&apos;s talk <span>↗</span></a>
      </nav>

      <section className="hero shell" id="top">
        <div className="hero-copy reveal">
          <div className="availability"><i /> Available for interesting work</div>
          <p className="overline">SOFTWARE ENGINEER · GAME DEVELOPER · TOOL BUILDER</p>
          <h1>I build software that feels <em>considered.</em></h1>
          <p className="hero-intro">
            I&apos;m Peter—a software engineer focused on dependable systems, thoughtful interfaces and tools that solve real problems.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#work">Explore my work <span>↓</span></a>
            <a className="text-link" href="#about">More about me <span>↗</span></a>
          </div>
        </div>
        <SignalField />
        <div className="hero-index" aria-hidden="true"><span>PORTFOLIO</span><span>2026</span></div>
      </section>

      <section className="marquee" aria-label="Areas of expertise">
        <div>
          <span>FULL-STACK DEVELOPMENT</span><i />
          <span>TEST AUTOMATION</span><i />
          <span>GAME SYSTEMS</span><i />
          <span>INTERACTION DESIGN</span><i />
          <span>FULL-STACK DEVELOPMENT</span><i />
          <span>TEST AUTOMATION</span><i />
        </div>
      </section>

      <section className="work-section shell" id="work">
        <div className="section-heading">
          <div><span className="section-number">01</span><p>Selected work</p></div>
          <h2>Real projects.<br /><em>Real problems solved.</em></h2>
          <p>A selection of production software, interactive work and technical experiments.</p>
        </div>
        <div className="project-grid">
          {projects.map((project) => <ProjectCard key={project.number} project={project} />)}
        </div>
      </section>

      <section className="about-section" id="about">
        <div className="shell about-grid">
          <div className="section-marker"><span>02</span><p>How I work</p></div>
          <div className="about-copy">
            <h2>Engineering with an eye for the <em>whole experience.</em></h2>
            <p>I care about what happens after the code compiles: whether the interface makes sense, whether the system is maintainable and whether it genuinely makes somebody&apos;s work easier.</p>
            <p>My background in automated testing shapes how I build. I naturally look for edge cases, failure points and opportunities to make repetitive work disappear.</p>
          </div>
          <div className="capabilities">
            {capabilities.map(([number, title, text]) => (
              <div className="capability" key={number}>
                <span>{number}</span><div><h3>{title}</h3><p>{text}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="contact-section shell" id="contact">
        <p className="overline">HAVE SOMETHING INTERESTING IN MIND?</p>
        <h2>Let&apos;s build something<br /><em>worth using.</em></h2>
        <p className="contact-copy">I&apos;m always interested in useful software, unusual technical problems and ambitious projects.</p>
        <div className="contact-actions">
          <a className="button button-primary" href="https://github.com/TheOnlyPete" target="_blank" rel="noreferrer">View GitHub <span>↗</span></a>
          <span>Contact details coming soon</span>
        </div>
      </section>

      <footer className="footer shell">
        <span>© {new Date().getFullYear()} Peter Murphy</span>
        <span>Designed and built with intent.</span>
        <a href="#top">Back to top ↑</a>
      </footer>
    </main>
  );
}
