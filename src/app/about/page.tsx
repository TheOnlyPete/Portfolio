export default function AboutPage() {
  return (
    <main className="about-page">
      <header className="browser-header wide-shell"><a href="/">← Peter Murphy</a><span>About</span><a href="/projects">Projects</a></header>
      <section className="about-hero wide-shell"><p>About me</p><h1>I build with equal attention to <span>how things work</span> and how they feel.</h1></section>
      <section className="about-body wide-shell">
        <div className="about-aside"><span>Software engineer</span><span>Automated testing</span><span>Game development</span><span>United Kingdom</span></div>
        <div className="about-text"><p>I&apos;m a software engineer with a background in automated testing and framework development. I build internal business software, developer tools, games and interactive experiments.</p><p>I&apos;m most interested in work where engineering and experience meet: reliable systems that are also clear, thoughtful and genuinely pleasant to use.</p><a href="/projects">Explore my projects <span>→</span></a></div>
      </section>
    </main>
  );
}
