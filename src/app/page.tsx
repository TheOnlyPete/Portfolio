"use client";

import { useEffect, useRef } from "react";

export default function HomePage() {
  const stage = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const move = (event: PointerEvent) => {
      element.style.setProperty("--mx", `${event.clientX}px`);
      element.style.setProperty("--my", `${event.clientY}px`);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);

  return (
    <main className="landing">
      <header className="landing-header wide-shell">
        <a className="identity" href="/"><span>Peter Murphy</span><small>Software Engineer</small></a>
        <nav><a href="/projects">Projects</a><a href="/about">About</a><a href="#contact">Contact</a></nav>
      </header>

      <section className="landing-stage wide-shell" ref={stage}>
        <div className="landing-light" aria-hidden="true" />
        <div className="landing-copy">
          <p className="intro-line"><span /> Software engineer · Game developer · Tool builder</p>
          <h1>Things should work.<br /><em>They should feel good, too.</em></h1>
          <p className="landing-summary">I design and build software, games and tools—combining dependable engineering with interfaces people actually enjoy using.</p>
        </div>

        <div className="landing-actions">
          <a className="entrance entrance--primary" href="/projects">
            <span className="entrance-number">01</span>
            <span className="entrance-label"><strong>Explore projects</strong><small>Games, software, websites and APIs</small></span>
            <span className="entrance-arrow">→</span>
          </a>
          <a className="entrance" href="/about">
            <span className="entrance-number">02</span>
            <span className="entrance-label"><strong>About me</strong><small>Experience, approach and skills</small></span>
            <span className="entrance-arrow">→</span>
          </a>
        </div>
      </section>

      <footer className="landing-footer wide-shell" id="contact">
        <span>Based in the United Kingdom</span>
        <span className="available"><i /> Available for interesting work</span>
        <a href="https://github.com/TheOnlyPete" target="_blank" rel="noreferrer">GitHub ↗</a>
      </footer>
    </main>
  );
}
