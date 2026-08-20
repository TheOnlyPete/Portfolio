"use client";

import { useState } from "react";
import SiteHeader from "./components/SiteHeader";
import projects from "../../content/projects.json";
import site from "../../content/site.json";

type HomeFeature = { slug: string; image?: string };
type HomeSettings = {
  title?: string;
  tagline?: string;
  exploreLabel?: string;
  exploreUrl?: string;
  footerLabel?: string;
  footerUrl?: string;
  featured?: HomeFeature[];
};

const home = site.home as HomeSettings;
const fallbackFeatures: HomeFeature[] = projects.filter(project => project.featured).map(project => ({ slug: project.slug }));
const configuredFeatures = home.featured?.length ? home.featured : fallbackFeatures;
const featured = configuredFeatures.flatMap(feature => {
  const project = projects.find(item => item.slug === feature.slug);
  return project ? [{ ...project, homeImage: feature.image || project.image }] : [];
});

export default function HomePage() {
  const [index, setIndex] = useState(0);
  const project = featured[index] ?? featured[0];

  function previous() {
    if (featured.length) setIndex(current => (current - 1 + featured.length) % featured.length);
  }

  function next() {
    if (featured.length) setIndex(current => (current + 1) % featured.length);
  }

  return (
    <main className={`simple-home simple-home--${project?.visual || "portfolio"}`}>
      <SiteHeader />

      <section className="simple-identity">
        <h1>{home.title || site.name}</h1>
        <p>{home.tagline || site.role}</p>
      </section>

      {project ? (
        <section className="project-carousel" aria-label="Featured projects">
          <button className="carousel-arrow carousel-arrow--left" type="button" onClick={previous} aria-label="Previous featured project">←</button>

          <a className="carousel-project" key={project.slug} href={`/projects/${project.category.toLowerCase()}/${project.slug}`}>
            <div className="carousel-art">
              {project.homeImage ? <img src={project.homeImage} alt="" /> : <span>{project.title.charAt(0)}</span>}
            </div>
            <div className="carousel-copy">
              <h2>{project.title}</h2>
              <p>{project.summary}</p>
            </div>
          </a>

          <button className="carousel-arrow carousel-arrow--right" type="button" onClick={next} aria-label="Next featured project">→</button>
        </section>
      ) : <section className="project-carousel project-carousel--empty">Choose featured projects in the portfolio editor.</section>}

      <div className="simple-actions">
        {featured.length > 1 && <div className="carousel-dots" aria-label={`Project ${index + 1} of ${featured.length}`}>
          {featured.map((item, itemIndex) => <button type="button" key={item.slug} className={itemIndex === index ? "active" : ""} onClick={() => setIndex(itemIndex)} aria-label={`Show ${item.title}`} />)}
        </div>}
        <a className="simple-explore" href={home.exploreUrl || "/projects"}><span>{home.exploreLabel || "Explore all projects"}</span><i>→</i></a>
      </div>

      <footer className="simple-footer"><a href={home.footerUrl || site.github} target="_blank" rel="noreferrer">{home.footerLabel || "GitHub ↗"}</a></footer>
    </main>
  );
}
