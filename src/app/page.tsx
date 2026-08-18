export default function HomePage() {
  return (
    <main className="home-page">
      <div className="top-accent" />
      <nav className="main-nav" aria-label="Primary navigation">
        <a className="active" href="/">Home</a>
        <a href="/projects">Projects</a>
        <a href="/about">About</a>
        <a href="#contact">Contact</a>
      </nav>

      <section className="home-identity">
        <h1>Peter Murphy</h1>
        <p>Software Developer</p>
        <a className="projects-button" href="/projects"><span>View my projects</span><i>→</i></a>
      </section>

      <footer className="home-footer" id="contact">
        <a href="https://github.com/TheOnlyPete" target="_blank" rel="noreferrer">GitHub</a>
        <span>United Kingdom</span>
      </footer>
    </main>
  );
}
