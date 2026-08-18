"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import projects from "../../content/projects.json";

const accentByVisual: Record<string, string> = {
  daydrop: "122, 151, 255",
  pizza: "218, 139, 99",
  boids: "87, 190, 178",
  mandelbrot: "160, 118, 225",
  portfolio: "170, 176, 188",
  api: "104, 158, 220",
};

export default function HomePage() {
  const featured = useMemo(() => projects.filter(project => project.featured), []);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const page = useRef<HTMLElement>(null);

  useEffect(() => setIndex(Math.floor(Math.random() * featured.length)), [featured.length]);
  useEffect(() => {
    if (paused || featured.length < 2) return;
    const timer = window.setInterval(() => setIndex(current => (current + 1) % featured.length), 7000);
    return () => window.clearInterval(timer);
  }, [paused, featured.length]);

  const active = featured[index] ?? featured[0];
  const accent = accentByVisual[active?.visual] ?? "122, 151, 255";

  function track(event: React.PointerEvent<HTMLElement>) {
    page.current?.style.setProperty("--pointer-x", `${event.clientX}px`);
    page.current?.style.setProperty("--pointer-y", `${event.clientY}px`);
  }

  return (
    <main className="brand-home" ref={page} onPointerMove={track} style={{ "--project-accent": accent } as React.CSSProperties}>
      <div className="home-spotlight" aria-hidden="true" />
      <header className="brand-header home-shell">
        <a className="brand-mark" href="/"><span>PM</span><i /></a>
        <nav><a href="/projects">Projects</a><a href="/about">About</a><a href="#contact">Contact</a></nav>
      </header>

      <section className="brand-hero home-shell">
        <div className="brand-intro">
          <p className="role">Software developer · Game developer · Tool builder</p>
          <h1>Peter Murphy</h1>
          <p className="statement">I build reliable software, games and tools with a focus on how they work—and how they feel to use.</p>
          <div className="brand-actions">
            <a className="action-primary" href="/projects"><span>Explore projects</span><i>→</i></a>
            <a className="action-secondary" href="/about">About me</a>
          </div>
        </div>
        <div className="brand-meta">
          <span>Based in the UK</span><span>Software engineering</span><span>Automation &amp; interactive work</span>
        </div>
      </section>

      <section className="featured-rail" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}>
        <div className="home-shell featured-inner">
          <div className="featured-label"><span>Featured work</span><small>{String(index + 1).padStart(2,"0")} / {String(featured.length).padStart(2,"0")}</small></div>
          <a className="featured-copy" href={`/projects/${active.category.toLowerCase()}/${active.slug}`} key={`copy-${active.slug}`}>
            <small>{active.category} · {active.year}</small><strong>{active.title}</strong><p>{active.summary}</p>
          </a>
          <a className="featured-image" href={`/projects/${active.category.toLowerCase()}/${active.slug}`} key={`image-${active.slug}`}>
            {active.image ? <img src={active.image} alt="" /> : <span>{active.title.charAt(0)}</span>}
            <i>View project ↗</i>
          </a>
          <div className="featured-controls">
            <button type="button" aria-label="Previous project" onClick={() => setIndex(current => (current - 1 + featured.length) % featured.length)}>←</button>
            <button type="button" aria-label="Next project" onClick={() => setIndex(current => (current + 1) % featured.length)}>→</button>
          </div>
        </div>
      </section>

      <footer className="brand-footer home-shell" id="contact"><span>© {new Date().getFullYear()} Peter Murphy</span><a href="https://github.com/TheOnlyPete" target="_blank" rel="noreferrer">GitHub ↗</a></footer>
    </main>
  );
}
