import { NextRequest, NextResponse } from "next/server";

type CouncilEvent = { title?: unknown; start?: unknown };

function isoDate(date: Date) { return date.toISOString().slice(0, 10); }
function rollingUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" || !url.hostname.toLowerCase().endsWith(".gov.uk")) throw new Error("Only HTTPS council URLs are allowed");
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(end.getDate() + 120);
  url.pathname = url.pathname.replace(/\/\d{4}-\d{2}-\d{2}\/\d{4}-\d{2}-\d{2}\/?$/, `/${isoDate(start)}/${isoDate(end)}`);
  return url;
}
function eventDate(value: unknown) {
  if (typeof value === "number") return new Date(value < 10_000_000_000 ? value * 1000 : value);
  if (typeof value !== "string") return null;
  const microsoft = value.match(/-?\d{10,13}/);
  const parsed = microsoft ? new Date(Number(microsoft[0]) * (microsoft[0].length === 10 ? 1000 : 1)) : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
function cleanTitle(value: unknown) {
  const title = String(value ?? "Bin collection").trim();
  const lower = title.toLowerCase();
  if (lower.includes("recycl")) return "Recycling";
  if (lower.includes("refuse") || lower.includes("residual") || lower.includes("general")) return "Refuse";
  if (lower.includes("garden")) return "Garden waste";
  if (lower.includes("food")) return "Food waste";
  return title;
}

export async function GET(request: NextRequest) {
  try {
    const source = request.nextUrl.searchParams.get("source");
    if (!source) return NextResponse.json({ error: "Missing council URL" }, { status: 400 });
    const response = await fetch(rollingUrl(source), { headers: { Accept: "application/json" }, next: { revalidate: 21600 } });
    if (!response.ok) throw new Error(`Council returned ${response.status}`);
    const payload = await response.json();
    if (!Array.isArray(payload)) throw new Error("Unexpected council response");
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const collections = (payload as CouncilEvent[]).map(item => {
      const date = eventDate(item.start);
      return date && date >= today ? { title: cleanTitle(item.title), date: date.toISOString() } : null;
    }).filter((item): item is { title: string; date: string } => item !== null)
      .sort((a, b) => a.date.localeCompare(b.date));
    return NextResponse.json({ collections }, { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=21600" } });
  } catch (error) {
    console.error("Bin collection lookup failed:", error);
    return NextResponse.json({ error: "Unable to retrieve bin collections" }, { status: 502 });
  }
}
