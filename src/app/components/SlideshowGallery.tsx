"use client";

import { useEffect, useState } from "react";

export type GalleryImage = { src: string; alt?: string };
type Props = { images?: GalleryImage[]; heading?: string; interval?: number };

export default function SlideshowGallery({ images = [], heading = "Project gallery", interval = 20 }: Props) {
  const [index, setIndex] = useState(0);
  const [enlarged, setEnlarged] = useState(false);
  const available = images.filter(image => image?.src);
  const current = available[index % Math.max(available.length, 1)];

  useEffect(() => {
    if (available.length < 2 || interval <= 0 || enlarged) return;
    const timer = window.setInterval(() => setIndex(value => (value + 1) % available.length), interval * 1000);
    return () => window.clearInterval(timer);
  }, [available.length, interval, enlarged]);

  useEffect(() => {
    if (!enlarged) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setEnlarged(false); };
    window.addEventListener("keydown", close);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", close); };
  }, [enlarged]);

  useEffect(() => { if (index >= available.length) setIndex(0); }, [available.length, index]);

  if (!current) return <section className="slideshow-gallery slideshow-gallery--empty"><p>Add images to this gallery in the portfolio editor.</p></section>;

  const previous = () => setIndex(value => (value - 1 + available.length) % available.length);
  const next = () => setIndex(value => (value + 1) % available.length);

  return <>
    <section className="slideshow-gallery" aria-label={heading}>
      <div className="slideshow-heading"><h2>{heading}</h2><span>{index + 1} / {available.length}</span></div>
      <div className="slideshow-stage" aria-live="polite">
        {available.length > 1 && <button type="button" className="slideshow-arrow slideshow-arrow--previous" onClick={previous} aria-label="Previous image">←</button>}
        <button type="button" className="slideshow-image-button" onClick={() => setEnlarged(true)} aria-label="Enlarge image">
          <img src={current.src} alt={current.alt ?? ""} />
        </button>
        {available.length > 1 && <button type="button" className="slideshow-arrow slideshow-arrow--next" onClick={next} aria-label="Next image">→</button>}
      </div>
      {available.length > 1 && <div className="slideshow-dots" aria-label="Choose image">{available.map((image, imageIndex) => <button type="button" key={`${image.src}-${imageIndex}`} className={imageIndex === index ? "active" : ""} onClick={() => setIndex(imageIndex)} aria-label={`Show image ${imageIndex + 1}`} />)}</div>}
    </section>
    {enlarged && <div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label="Enlarged gallery image" onClick={() => setEnlarged(false)}>
      <button type="button" className="gallery-lightbox-close" onClick={() => setEnlarged(false)} aria-label="Close enlarged image">×</button>
      <img src={current.src} alt={current.alt ?? ""} onClick={event => event.stopPropagation()} />
    </div>}
  </>;
}
