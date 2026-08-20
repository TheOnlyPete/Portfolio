import products from "../../../../content/products.json";
import { notFound } from "next/navigation";
import SiteHeader from "../../components/SiteHeader";
import StoryContent, { type StoryBlock } from "../../components/StoryContent";

type HeaderOptions = { showMeta?: boolean; showTitle?: boolean; showSummary?: boolean; showTags?: boolean; showDivider?: boolean; showIcon?: boolean; icon?: string };

export function generateStaticParams() { return products.map(product => ({ slug: product.slug })); }

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = products.find(item => item.slug === slug);
  if (!product) notFound();
  const blocks = (product.blocks ?? []) as StoryBlock[];
  const header = ((product as typeof product & { header?: HeaderOptions }).header ?? {}) as HeaderOptions;
  const showMeta = header.showMeta === true;
  const showTitle = header.showTitle !== false;
  const showSummary = header.showSummary !== false;
  const showTags = header.showTags !== false;
  const headerIcon = header.icon || product.image;
  const showIcon = header.showIcon === true && Boolean(headerIcon);

  return <main className={`story-page product-story-page product-story-page--${product.visual || "default"}`}>
    <SiteHeader />
    <header className={`story-hero ${showIcon ? "story-hero--with-icon" : ""}`}>
      <div className="story-hero-layout">
        {showIcon && <img className="story-hero-icon" src={headerIcon} alt="" />}
        <div className="story-hero-copy">
          {showMeta && <p>Product · {product.year}</p>}
          {showTitle && <h1>{product.title}</h1>}
          {showSummary && <p className="story-summary">{product.summary}</p>}
          {showTags && <div className="story-tech">{product.technologies.map(item => <span key={item}>{item}</span>)}</div>}
        </div>
      </div>
    </header>
    {header.showDivider && <hr className="story-header-divider" />}
    <StoryContent blocks={blocks} fallback={product.description} />
    <footer className="story-footer"><a href="/products">← Back to all products</a></footer>
  </main>;
}
