import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { exec } from "node:child_process";

const root = process.cwd();
const editor = path.join(root, "tools", "content-manager");
const publicRoot = path.join(root, "public");
const contentFiles = {
  site: "content/site.json",
  about: "content/pages/about.json",
  contact: "content/pages/contact.json",
  categories: "content/categories.json",
  projects: "content/projects.json",
  products: "content/products.json",
};
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml", ".mp4": "video/mp4", ".webm": "video/webm" };

function safePart(value) { return (value || "file").replace(/[^a-zA-Z0-9._-]/g, "-"); }
function inside(base, requested) {
  const resolved = path.resolve(base, "." + requested);
  return resolved === base || resolved.startsWith(base + path.sep) ? resolved : null;
}
function reply(res, status, body, type = "application/json") {
  res.writeHead(status, { "Content-Type": `${type}; charset=utf-8`, "Cache-Control": "no-store" });
  res.end(body);
}
async function body(req) { const chunks = []; for await (const chunk of req) chunks.push(chunk); return Buffer.concat(chunks); }

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://127.0.0.1");
    if (req.method === "GET" && url.pathname === "/api/content") {
      const entries = await Promise.all(Object.entries(contentFiles).map(async ([name, file]) => [name, JSON.parse(await fs.readFile(path.join(root, file), "utf8"))]));
      return reply(res, 200, JSON.stringify(Object.fromEntries(entries)));
    }
    if (req.method === "POST" && url.pathname === "/api/content") {
      const data = JSON.parse((await body(req)).toString("utf8"));
      await Promise.all(Object.entries(contentFiles).filter(([name]) => name in data).map(([name, file]) => fs.writeFile(path.join(root, file), JSON.stringify(data[name], null, 2) + "\n")));
      return reply(res, 200, JSON.stringify({ ok: true }));
    }
    if (req.method === "POST" && url.pathname === "/api/upload") {
      const slug = safePart(url.searchParams.get("slug"));
      const name = safePart(url.searchParams.get("name"));
      const scope = url.searchParams.get("scope") === "products" ? "products" : "projects";
      const folder = path.join(publicRoot, scope, slug);
      await fs.mkdir(folder, { recursive: true });
      await fs.writeFile(path.join(folder, name), await body(req));
      return reply(res, 200, JSON.stringify({ path: `/${scope}/${slug}/${name}` }));
    }
    if (req.method === "GET" && url.pathname === "/asset") {
      const file = inside(publicRoot, url.searchParams.get("path") || "");
      if (!file) return reply(res, 400, "Invalid path", "text/plain");
      return reply(res, 200, await fs.readFile(file), types[path.extname(file).toLowerCase()] || "application/octet-stream");
    }
    const requested = url.pathname === "/" ? "/index.html" : url.pathname;
    const file = inside(editor, requested);
    if (!file) return reply(res, 404, "Not found", "text/plain");
    return reply(res, 200, await fs.readFile(file), types[path.extname(file)] || "text/plain");
  } catch (error) { reply(res, 500, JSON.stringify({ error: error.message })); }
});

server.listen(4173, "127.0.0.1", () => {
  const url = "http://127.0.0.1:4173";
  console.log(`Visual content editor: ${url}`);
  if (process.platform === "win32") exec(`start "" "${url}"`);
});
