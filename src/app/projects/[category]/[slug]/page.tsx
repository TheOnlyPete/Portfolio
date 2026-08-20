import projects from "../../../../../content/projects.json";
import { notFound } from "next/navigation";
import SiteHeader from "../../../components/SiteHeader";
import StoryContent, { type StoryBlock } from "../../../components/StoryContent";

type HeaderOptions = { showMeta?: boolean; showTitle?: boolean; showSummary?: boolean; showTags?: boolean; showDivider?: boolean; showIcon?: boolean; icon?: string };

export function generateStaticParams() {
  return projects.map(project => ({ category: project.category.toLowerCase(), slug: project.slug }));
}

export default async function ProjectPage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { slug } = await params;
  const project = projects.find(item => item.slug === slug);
  if (!project) notFound();
  const blocks = (project.blocks ?? []) as StoryBlock[];
  const header = ((project as typeof project & { header?: HeaderOptions }).header ?? {}) as HeaderOptions;
  const showMeta = header.showMeta !== false;
  const showTitle = header.showTitle !== false;
  const showSummary = header.showSummary !== false;
  const showTags = header.showTags !== false;
  const headerIcon = header.icon || project.image;
  const showIcon = header.showIcon === true && Boolean(headerIcon);
  const hasHeader = showMeta || showTitle || showSummary || showTags || showIcon;

  return (
    <main className="story-page">
      <SiteHeader />
      {hasHeader && <header className={`story-hero ${showIcon ? "story-hero--with-icon" : ""}`}>
        <div className="story-hero-layout">
          {showIcon && <img className="story-hero-icon" src={headerIcon} alt="" />}
          <div className="story-hero-copy">
            {showMeta && <p>{project.category} · {project.year}</p>}
            {showTitle && <h1>{project.title}</h1>}
            {showSummary && <p className="story-summary">{project.summary}</p>}
            {showTags && <div className="story-tech">{project.technologies.map(item => <span key={item}>{item}</span>)}</div>}
          </div>
        </div>
      </header>}
      {header.showDivider && <hr className="story-header-divider" />}
      <StoryContent blocks={blocks} fallback={project.description} />
      <footer className="story-footer"><a href="/projects">← Back to all projects</a></footer>
    </main>
  );
}
