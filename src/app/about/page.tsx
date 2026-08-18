export default function AboutPage() {
  return (
    <main className="clean-about">
      <header className="simple-header clean-about-header">
        <a className="clean-about-name" href="/">Peter Murphy</a>
        <nav><a href="/">Home</a><a href="/projects">Projects</a><a href="#contact">Contact</a></nav>
      </header>

      <article className="about-container">
        <header className="about-introduction">
          <p className="about-label">About</p>
          <h1>I&apos;m Peter, a software developer based in the UK.</h1>
          <p className="about-lead">I build business software, developer tools, games and interactive experiments. I care about making things dependable, understandable and genuinely pleasant to use.</p>
        </header>

        <section className="about-section">
          <h2>Background</h2>
          <div className="about-prose">
            <p>My professional background is in automated software testing and framework development. I&apos;ve worked on the systems behind test automation, including tooling for difficult page structures, tables, iframes and repeatable workflows.</p>
            <p>Outside that role, I design and build my own software. That includes Daydrop, a complete internal leave and payroll system delivered for a working office, alongside games, graphics experiments and smaller utilities.</p>
          </div>
        </section>

        <section className="about-section">
          <h2>What I work on</h2>
          <div className="work-list">
            <div><h3>Software development</h3><p>Full-stack applications and internal systems built around real operational requirements.</p></div>
            <div><h3>Test automation</h3><p>Framework tooling and utilities that make complicated, repetitive testing more reliable.</p></div>
            <div><h3>Games &amp; interactive work</h3><p>Game systems, simulations, shaders and experiments where engineering meets interaction.</p></div>
          </div>
        </section>

        <section className="about-contact" id="contact">
          <div><h2>Want to see what I&apos;ve built?</h2><p>The Projects page contains my software, games, APIs and experiments.</p></div>
          <a href="/projects"><span>Explore projects</span><i>→</i></a>
        </section>
      </article>

      <footer className="simple-footer clean-about-footer"><span>© {new Date().getFullYear()} Peter Murphy</span><a href="https://github.com/TheOnlyPete" target="_blank" rel="noreferrer">GitHub ↗</a></footer>
    </main>
  );
}
