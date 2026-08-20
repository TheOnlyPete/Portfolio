import HomeExperience, { type HomeFeature } from "./components/HomeExperience";
import projects from "../../content/projects.json";
import site from "../../content/site.json";

type FeatureConfig = { slug: string; image?: string; accent?: string };
const home = site.home;
const fallbackFeatures: FeatureConfig[] = projects.filter(project => project.featured).map(project => ({ slug: project.slug }));
const configuredFeatures: FeatureConfig[] = home.featured?.length ? home.featured : fallbackFeatures;
const featured: HomeFeature[] = configuredFeatures.flatMap(feature => {
  const project = projects.find(item => item.slug === feature.slug);
  return project ? [{
    slug: project.slug,
    title: project.title,
    summary: project.summary,
    category: project.category,
    visual: project.visual,
    homeImage: feature.image || project.image,
    homeAccent: feature.accent,
  }] : [];
});

export default function HomePage() {
  return <HomeExperience home={home} site={{ name: site.name, role: site.role, github: site.github }} featured={featured} />;
}
