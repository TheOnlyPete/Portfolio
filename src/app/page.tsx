"use client";

import { useEffect, useRef, useState } from "react";
import projects from "../../content/projects.json";

const categories = ["All", "Software", "Games", "Experiments"];
const Arrow = () => <span className="arrow" aria-hidden="true">↗</span>;

function ProjectCard({ project, featured = false }: { project: (typeof projects)[number]; featured?: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);
  function trackPointer(event: React.PointerEvent<HTMLAnchorElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--x", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--y", `${event.clientY - rect.top}px`);
  }
  return (
    <a ref={ref} onPointerMove={trackPointer} className={`project${featured ? " project--featured" : ""} reveal`} href={`/work/${project.category.toLowerCase()}/${project.slug}`}>
      <div className={`project-visual visual--${project.visual}`}>
        <div className="visual-glow" />
        <span className="visual-name">{project.displayTitle}</span>
        <span className="visual-type">{project.category} · {project.year}</span>
      </div>
      <div className="project-info">
        <div><p className="project-kind">{project.category}</p><h3>{project.title}</h3></div>
        <p>{project.summary}</p><Arrow />
      </div>
      <div className="pointer-light" aria-hidden="true" />
    </a>
  );
}

export default function HomePage() {
  const [category, setCategory] = useState("All");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const observer = new IntersectionObserver(entries => entries.forEach(entry => entry.isIntersecting && entry.target.classList.add("is-visible")), { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach(element => observer.observe(element));
    return () => { window.removeEventListener("scroll", onScroll); observer.disconnect(); };
  }, [category]);

  const featured = projects.find(project => project.featured) ?? projects[0];
  const remaining = projects.filter(project => !project.featured && (category === "All" || project.category === category));

  return (
    <main>
      <header className={`site-header${scrolled ? " site-header--scrolled" : ""}`}>
        <nav className="shell nav">
          <a className="brand" href="#top">Peter Murphy</a>
          <div className="nav-links"><a href="#work">Work</a><a href="#about">About</a></div>
          <a className="nav-contact" href="#contact">Get in touch <Arrow /></a>
        </nav>
      </header>

      <section className="hero shell" id="top">
        <div className="hero-main reveal is-visible">
          <p className="hero-role">Software engineer &amp; game developer</p>
          <h1>I build thoughtful software for <span>real problems.</span></h1>
        </div>
        <div className="hero-bottom reveal is-visible">
          <p>I&apos;m Peter, a UK-based developer creating dependable business software, developer tools and interactive experiences.</p>
          <a className="primary-button" href="#work"><span>View selected work</span><span className="button-icon">↓</span></a>
        </div>
        <div className="hero-ambient" aria-hidden="true" />
      </section>

      <section className="work shell" id="work">
        <div className="section-intro reveal"><h2>Selected work</h2><p>Production software, games and technical experiments.</p></div>
        <ProjectCard project={featured} featured />
        <div className="work-toolbar reveal">
          <h2>More projects</h2>
          <div className="category-filter" aria-label="Filter projects">
            {categories.map(item => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)} type="button">{item}</button>)}
          </div>
        </div>
        <div className="project-grid">{remaining.map(project => <ProjectCard key={project.slug} project={project} />)}</div>
      </section>

      <section className="about" id="about">
        <div className="shell about-inner reveal">
          <h2>Useful beats impressive.<br /><span>The best work does both.</span></h2>
          <div className="about-copy">
            <p>I care about the whole experience: whether the interface makes sense, whether the system is maintainable and whether it genuinely improves somebody&apos;s day.</p>
            <p>My background in test automation means I naturally look for edge cases, failure points and repetitive work that software can remove.</p>
          </div>
        </div>
      </section>

      <section className="contact shell reveal" id="contact">
        <p>Have an interesting problem?</p><h2>Let&apos;s talk.</h2>
        <a className="primary-button" href="https://github.com/TheOnlyPete" target="_blank" rel="noreferrer"><span>View GitHub</span><Arrow /></a>
      </section>

      <footer className="footer shell"><span>© {new Date().getFullYear()} Peter Murphy</span><span>Software engineer · United Kingdom</span><a href="#top">Back to top ↑</a></footer>
    </main>
  );
}
