import site from "../../../content/site.json";
import about from "../../../content/pages/about.json";

export default function AboutPage() {
  return (
    <main className="clean-about">
      <header className="simple-header clean-about-header">
        <a className="clean-about-name" href="/">{site.name}</a>
        <nav><a href="/">Home</a><a href="/projects">Projects</a><a href="/contact">Contact</a></nav>
      </header>

      <article className="about-container">
        <header className="about-introduction">
          <p className="about-label">About</p>
          <h1>{about.heading}</h1>
          <p className="about-lead">{about.lead}</p>
        </header>

        <section className="about-section">
          <h2>Background</h2>
          <div className="about-prose">
            {about.background.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </section>

        <section className="about-section">
          <h2>What I work on</h2>
          <div className="work-list">
            {about.workAreas.map(area => <div key={area.title}><h3>{area.title}</h3><p>{area.description}</p></div>)}
          </div>
        </section>

        <section className="about-contact" id="contact">
          <div><h2>Want to see what I&apos;ve built?</h2><p>The Projects page contains my software, games, APIs and experiments.</p></div>
          <a href="/projects"><span>Explore projects</span><i>→</i></a>
        </section>
      </article>

      <footer className="simple-footer clean-about-footer"><span>© {new Date().getFullYear()} {site.name}</span><a href={site.github} target="_blank" rel="noreferrer">GitHub ↗</a></footer>
    </main>
  );
}
