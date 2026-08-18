"use client";

import { useMemo, useState } from "react";
import projects from "../../../content/projects.json";

const categories = ["Featured", "Games", "Software", "Websites", "APIs", "Experiments"];

export default function ProjectsPage() {
  const [category, setCategory] = useState("Featured");
  const [activeSlug, setActiveSlug] = useState(projects[0]?.slug ?? "");

  const visible = useMemo(() => category === "Featured" ? projects.filter(project => project.featured) : projects.filter(project => project.category === category), [category]);
  const active = projects.find(project => project.slug === activeSlug && visible.includes(project)) ?? visible[0];

  return (
    <main className="project-browser">
      <header className="browser-header wide-shell">
        <a href="/" className="back-link">← Peter Murphy</a>
        <span>Selected work</span>
        <a href="/about">About</a>
      </header>

      <section className="browser-title wide-shell">
        <p>Projects</p>
        <h1>Work I&apos;ve designed,<br />built and shipped.</h1>
      </section>

      <nav className="category-nav" aria-label="Project categories">
        <div className="wide-shell">
          {categories.map(item => <button key={item} type="button" className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}
        </div>
      </nav>

      <section className="browser-work wide-shell">
        <div className="project-list">
          {visible.length ? visible.map((project, index) => (
            <a
              className={`project-row${active?.slug === project.slug ? " active" : ""}`}
              href={`/projects/${project.category.toLowerCase()}/${project.slug}`}
              key={project.slug}
              onPointerEnter={() => setActiveSlug(project.slug)}
              onFocus={() => setActiveSlug(project.slug)}
            >
              <span className="row-index">{String(index + 1).padStart(2,"0")}</span>
              <span className="row-main"><strong>{project.title}</strong><small>{project.summary}</small></span>
              <span className="row-year">{project.year}</span>
              <span className="row-arrow">↗</span>
              <div className={`mobile-preview preview--${project.visual}`}><span>{project.displayTitle}</span></div>
            </a>
          )) : (
            <div className="empty-category"><strong>{category}</strong><p>Your first {category.toLowerCase()} project will appear here when you add it.</p></div>
          )}
        </div>

        <div className="preview-stage" aria-live="polite">
          {active && <div key={active.slug} className={`preview-card preview--${active.visual}`}>
            <div className="preview-orbit" />
            <span className="preview-category">{active.category} · {active.year}</span>
            <strong>{active.displayTitle}</strong>
            <span className="preview-hint">Open project ↗</span>
          </div>}
        </div>
      </section>
    </main>
  );
}
