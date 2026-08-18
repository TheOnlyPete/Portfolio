"use client";

import { useMemo, useState } from "react";
import projects from "../../../content/projects.json";

const categories = ["All", "Games", "Software", "Websites", "APIs", "Experiments"];

export default function ProjectsPage() {
  const [category, setCategory] = useState("All");
  const visible = useMemo(() => category === "All" ? projects : projects.filter(project => project.category === category), [category]);

  return (
    <main className="projects-page">
      <div className="top-accent" />
      <nav className="main-nav" aria-label="Primary navigation">
        <a href="/">Home</a><a className="active" href="/projects">Projects</a><a href="/about">About</a><a href="/#contact">Contact</a>
      </nav>

      <header className="page-heading">
        <h1>Projects</h1>
        <p>Games, software and tools I&apos;ve designed and built.</p>
      </header>

      <nav className="project-categories" aria-label="Project categories">
        {categories.map(item => <button key={item} type="button" className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}
      </nav>

      <section className="projects-grid">
        {visible.map(project => (
          <article className="project-panel" key={project.slug}>
            <a className="project-image" href={`/projects/${project.category.toLowerCase()}/${project.slug}`}>
              {project.image ? <img src={project.image} alt="" /> : <span>{project.title.charAt(0)}</span>}
            </a>
            <div className="project-copy">
              <div><p>{project.category} · {project.year}</p><h2>{project.title}</h2></div>
              <p className="project-summary">{project.summary}</p>
              <a className="read-more" href={`/projects/${project.category.toLowerCase()}/${project.slug}`}><span>View project</span><i>→</i></a>
            </div>
          </article>
        ))}
        {!visible.length && <div className="empty-projects">No {category.toLowerCase()} have been added yet.</div>}
      </section>
    </main>
  );
}
