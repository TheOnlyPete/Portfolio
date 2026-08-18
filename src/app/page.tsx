"use client";

import { useState } from "react";
import projects from "../../content/projects.json";

const featured = projects.filter(project => project.featured);

export default function HomePage() {
  const [index, setIndex] = useState(0);
  const project = featured[index] ?? featured[0];

  function previous() {
    setIndex(current => (current - 1 + featured.length) % featured.length);
  }

  function next() {
    setIndex(current => (current + 1) % featured.length);
  }

  return (
    <main className={`simple-home simple-home--${project.visual}`}>
      <header className="simple-header">
        <nav><a href="/projects">Projects</a><a href="/about">About</a><a href="#contact">Contact</a></nav>
      </header>

      <section className="simple-identity">
        <h1>Peter Murphy</h1>
        <p>Software developer · Game developer · Tool builder</p>
      </section>

      <section className="project-carousel" aria-label="Featured projects">
        <button className="carousel-arrow carousel-arrow--left" type="button" onClick={previous} aria-label="Previous featured project">←</button>

        <a className="carousel-project" key={project.slug} href={`/projects/${project.category.toLowerCase()}/${project.slug}`}>
          <div className="carousel-art">
            {project.image ? <img src={project.image} alt="" /> : <span>{project.title.charAt(0)}</span>}
          </div>
          <div className="carousel-copy">
            <h2>{project.title}</h2>
            <p>{project.summary}</p>
          </div>
        </a>

        <button className="carousel-arrow carousel-arrow--right" type="button" onClick={next} aria-label="Next featured project">→</button>
      </section>

      <div className="simple-actions">
        <div className="carousel-dots" aria-label={`Project ${index + 1} of ${featured.length}`}>
          {featured.map((item, itemIndex) => <button type="button" key={item.slug} className={itemIndex === index ? "active" : ""} onClick={() => setIndex(itemIndex)} aria-label={`Show ${item.title}`} />)}
        </div>
        <a className="simple-explore" href="/projects"><span>Explore all projects</span><i>→</i></a>
      </div>

      <footer className="simple-footer" id="contact"><a href="https://github.com/TheOnlyPete" target="_blank" rel="noreferrer">GitHub ↗</a></footer>
    </main>
  );
}
