import BinCollectionWidget from "./BinCollectionWidget";
import SlideshowGallery, { type GalleryImage } from "./SlideshowGallery";

export type StoryBlock = {
  type: "heading" | "text" | "image" | "video" | "split" | "divider" | "binWidget" | "gallery" | "button";
  heading?: string;
  text?: string;
  html?: string;
  src?: string;
  alt?: string;
  caption?: string;
  size?: "normal" | "wide" | "full";
  side?: "left" | "right";
  url?: string;
  label?: string;
  count?: number;
  recyclingIcon?: string;
  refuseIcon?: string;
  images?: GalleryImage[];
  interval?: number;
  thickness?: number;
};

function PlainText({ text = "" }: { text?: string }) {
  return <>{text.split("\n\n").map((paragraph, index) => <p key={index}>{paragraph}</p>)}</>;
}

export function StoryContentBlock({ block }: { block: StoryBlock }) {
  if (block.type === "heading") return <h2 className="story-heading">{block.heading}</h2>;
  if (block.type === "text") return block.html
    ? <div className="story-text story-rich-text" dangerouslySetInnerHTML={{ __html: block.html }} />
    : <div className="story-text"><PlainText text={block.text} /></div>;
  if (block.type === "divider") return <hr className="story-divider" style={{ borderTopWidth: block.thickness ?? 1 }} />;
  if (block.type === "button") return <div className="story-button-wrap"><a className="story-button" href={block.url || "#"}>{block.label || "Learn more"}<span>→</span></a></div>;
  if (block.type === "image") return <figure className={`story-media story-media--${block.size ?? "normal"}`}><img src={block.src} alt={block.alt ?? ""} />{block.caption && <figcaption>{block.caption}</figcaption>}</figure>;
  if (block.type === "video") return <figure className={`story-media story-media--${block.size ?? "wide"}`}><video src={block.src} controls playsInline />{block.caption && <figcaption>{block.caption}</figcaption>}</figure>;
  if (block.type === "split") return <section className={`story-split story-split--${block.side ?? "left"}`}><div className="story-split-media">{block.src && <img src={block.src} alt={block.alt ?? ""} />}</div><div><h2>{block.heading}</h2><PlainText text={block.text} /></div></section>;
  if (block.type === "binWidget") return <BinCollectionWidget sourceUrl={block.url} heading={block.heading} count={block.count} recyclingIcon={block.recyclingIcon} refuseIcon={block.refuseIcon} />;
  if (block.type === "gallery") return <SlideshowGallery images={block.images} heading={block.heading} interval={block.interval} />;
  return null;
}

export default function StoryContent({ blocks, fallback }: { blocks: StoryBlock[]; fallback?: string }) {
  return <article className="story-content">{blocks.length ? blocks.map((block, index) => <StoryContentBlock key={index} block={block} />) : <div className="story-text"><p>{fallback}</p></div>}</article>;
}
