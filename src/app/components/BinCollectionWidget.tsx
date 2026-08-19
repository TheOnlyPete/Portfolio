"use client";

import { useEffect, useState } from "react";

type Collection = { title: string; date: string };
type Props = { sourceUrl?: string; heading?: string; count?: number };

function ordinal(day: number) {
  if (day > 3 && day < 21) return "th";
  return ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[day % 10] ?? "th";
}

function friendlyDate(value: string) {
  const date = new Date(value);
  const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "long" }).format(date);
  const month = new Intl.DateTimeFormat("en-GB", { month: "long" }).format(date);
  return `${weekday} ${date.getDate()}${ordinal(date.getDate())} ${month}`;
}

function binKind(title: string) {
  const value = title.toLowerCase();
  if (value.includes("recycl")) return "recycling";
  if (value.includes("garden") || value.includes("food")) return "garden";
  return "general";
}

function BinIcon() {
  return <svg viewBox="0 0 84 104" role="img" aria-label="Wheelie bin">
    <path className="bin-lid" d="M13 18h58l5 9H8l5-9Z" />
    <path className="bin-handle" d="M29 18v-7h26v7" />
    <path className="bin-body" d="M14 31h56l-6 58H20l-6-58Z" />
    <path className="bin-detail" d="M29 40v38M42 40v38M55 40v38" />
    <circle cx="25" cy="94" r="6" /><circle cx="59" cy="94" r="6" />
  </svg>;
}

export default function BinCollectionWidget({ sourceUrl = "", heading = "Next bin collection", count = 2 }: Props) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "empty" | "error">(sourceUrl ? "loading" : "error");

  useEffect(() => {
    if (!sourceUrl) { setState("error"); return; }
    const controller = new AbortController();
    setState("loading");
    fetch(`/api/bin-collection?source=${encodeURIComponent(sourceUrl)}`, { signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(data => { const next = (data.collections ?? []).slice(0, count); setCollections(next); setState(next.length ? "ready" : "empty"); })
      .catch(error => { if (error.name !== "AbortError") setState("error"); });
    return () => controller.abort();
  }, [sourceUrl, count]);

  return <section className="bin-widget">
    <div className="bin-widget-heading"><span>Local collection</span><h2>{heading}</h2></div>
    {state === "loading" && <p className="bin-widget-message">Checking the collection calendar…</p>}
    {state === "empty" && <p className="bin-widget-message">No upcoming collections were found.</p>}
    {state === "error" && <p className="bin-widget-message">Collection information is currently unavailable.</p>}
    {state === "ready" && <div className="bin-collection-list">{collections.map((collection, index) => {
      const kind = binKind(collection.title);
      return <article className={`bin-collection bin-collection--${kind}`} key={`${collection.date}-${collection.title}-${index}`}>
        <div className="bin-collection-icon"><BinIcon /></div>
        <div><p>{friendlyDate(collection.date)}</p><h3>{collection.title}</h3></div>
      </article>;
    })}</div>}
  </section>;
}
