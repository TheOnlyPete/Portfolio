import site from "../../../content/site.json";
import contact from "../../../content/pages/contact.json";
import SiteHeader from "../components/SiteHeader";

export default function ContactPage() {
  return (
    <main className="clean-contact">
      <SiteHeader />

      <section className="contact-container">
        <p className="about-label">Contact</p>
        <h1>{contact.heading}</h1>
        <p className="contact-intro">{contact.intro}</p>

        <div className="contact-options">
          <div className="contact-option">
            <span>Email</span>
            {site.email ? <a href={`mailto:${site.email}`}>{site.email}<i>↗</i></a> : <p>Add your email using the local content manager.</p>}
          </div>
          <div className="contact-option">
            <span>GitHub</span>
            <a href={site.github} target="_blank" rel="noreferrer">TheOnlyPete<i>↗</i></a>
          </div>
        </div>
      </section>

      <footer className="simple-footer contact-footer"><span>© {new Date().getFullYear()} {site.name}</span><a href="/projects">View projects →</a></footer>
    </main>
  );
}
