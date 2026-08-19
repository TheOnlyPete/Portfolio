import projects from "../../../../../content/projects.json";
import { notFound } from "next/navigation";

type HeaderOptions = { showMeta?: boolean; showTitle?: boolean; showSummary?: boolean; showTags?: boolean; showDivider?: boolean };\n\ntype Block = {
  type: "heading" | "text" | "image" | "video" | "split" | "divider";
  heading?: string;
  text?: string;
  src?: string;
  alt?: string;
  caption?: string;
  size?: "normal" | "wide" | "full";
  side?: "left" | "right";
};

export function generateStaticParams() {
  return projects.map(project => ({ category: project.category.toLowerCase(), slug: project.slug }));
}

function ContentBlock({ block }: { block: Block }) {
  if (block.type === "heading") return <h2 className="story-heading">{block.heading}</h2>;
  if (block.type === "text") return <div className="story-text">{block.text?.split("\n\n").map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>;
  if (block.type === "divider") return <hr className="story-divider" />;
  if (block.type === "image") return <figure className={`story-media story-media--${block.size ?? "normal"}`}><img src={block.src} alt={block.alt ?? ""} />{block.caption && <figcaption>{block.caption}</figcaption>}</figure>;
  if (block.type === "video") return <figure className={`story-media story-media--${block.size ?? "wide"}`}><video src={block.src} controls playsInline />{block.caption && <figcaption>{block.caption}</figcaption>}</figure>;
  if (block.type === "split") return <section className={`story-split story-split--${block.side ?? "left"}`}><div className="story-split-media">{block.src && <img src={block.src} alt={block.alt ?? ""} />}</div><div><h2>{block.heading}</h2>{block.text?.split("\n\n").map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div></section>;
  return null;
}

export default async function ProjectPage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  const project = projects.find(item => item.category.toLowerCase() === category && item.slug === slug);
  if (!project) notFound();
  const blocks = (project.blocks ?? []) as Block[];
  const header = ((project as typeof project & { header?: HeaderOptions }).header ?? {}) as HeaderOptions;
  const showMeta = header.showMeta !== false;
  const showTitle = header.showTitle !== false;
  const showSummary = header.showSummary !== false;
  const showTags = header.showTags !== false;
  const hasHeader = showMeta || showTitle || showSummary || showTags;

  return (
    <main className="story-page">
      <nav className="story-nav"><a href="/projects">← Projects</a><a href="/">Peter Murphy</a></nav>
      {hasHeader && <header className="story-hero">
        {showMeta && <p>{project.category} · {project.year}</p>}
        {showTitle && <h1>{project.title}</h1>}
        {showSummary && <p className="story-summary">{project.summary}</p>}
        {showTags && <div className="story-tech">{project.technologies.map(item => <span key={item}>{item}</span>)}</div>}
      </header>}
      {header.showDivider && <hr className="story-header-divider" />}
      <article className="story-content">
        {blocks.length ? blocks.map((block, index) => <ContentBlock key={index} block={block} />) : <div className="story-text"><p>{project.description}</p></div>}
      </article>
      <footer className="story-footer"><a href="/projects">← Back to all projects</a></footer>
    </main>
  );
}
