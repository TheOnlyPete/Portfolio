import projects from "../../../../../content/projects.json";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return projects.map(project => ({ category: project.category.toLowerCase(), slug: project.slug }));
}

export default async function ProjectPage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  const project = projects.find(item => item.category.toLowerCase() === category && item.slug === slug);
  if (!project) notFound();
  return (
    <main className="detail-page">
      <nav className="detail-nav shell"><a href="/">← All work</a><span>Peter Murphy</span></nav>
      <header className="detail-hero shell">
        <p>{project.category} · {project.year}</p><h1>{project.title}</h1><p className="detail-summary">{project.summary}</p>
      </header>
      <div className={`detail-cover visual--${project.visual}`}><div className="visual-glow" /></div>
      <section className="detail-content shell">
        <div><p className="detail-label">Overview</p></div>
        <div>
          <p className="detail-lead">{project.description}</p>
          <div className="detail-tech">{project.technologies.map(item => <span key={item}>{item}</span>)}</div>
          <div className="content-placeholder"><h2>Full case study coming next.</h2><p>This page is generated from the project content file. Screenshots, development notes and the complete project story will be added through the local content workflow.</p></div>
        </div>
      </section>
    </main>
  );
}
