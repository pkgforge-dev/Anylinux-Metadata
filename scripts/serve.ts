import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = import.meta.dirname ?? dirname(fileURLToPath(import.meta.url));
const rootDir = join(currentDir, "..");
const webDir = join(rootDir, "web");

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".xml": "application/xml; charset=utf-8",
  ".gz": "application/gzip",
};

// Ensure catalog bundle exists before serving
const catalogDataPath = join(webDir, "catalog-data.js");
const catalogJsonPath = join(webDir, "catalog.json");
if (!existsSync(catalogDataPath) || !existsSync(catalogJsonPath)) {
  console.log("Catalog assets missing in web/. Generating offline bundle via export...");
  const { execSync } = await import("node:child_process");
  execSync("npm run export", { cwd: rootDir, stdio: "inherit" });
}

const PORT = parseInt(process.env.PORT || "3000", 10);

const server = createServer(async (req, res) => {
  try {
    const reqUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    let pathname = decodeURIComponent(reqUrl.pathname);

    if (pathname === "/" || pathname === "") {
      pathname = "/index.html";
    }

    const filePath = resolve(webDir, "." + pathname);

    // Prevent directory traversal outside web directory
    if (!filePath.startsWith(webDir)) {
      res.statusCode = 403;
      res.end("Forbidden");
      return;
    }

    try {
      const fileStat = await stat(filePath);
      let targetPath = filePath;

      if (fileStat.isDirectory()) {
        targetPath = join(filePath, "index.html");
      }

      const content = await readFile(targetPath);
      const ext = extname(targetPath).toLowerCase();
      const contentType = MIME_TYPES[ext] || "application/octet-stream";

      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "no-cache");
      res.statusCode = 200;
      res.end(content);
    } catch (err: any) {
      if (err.code === "ENOENT") {
        res.statusCode = 404;
        res.setHeader("Content-Type", "text/plain");
        res.end("404 Not Found");
      } else {
        res.statusCode = 500;
        res.setHeader("Content-Type", "text/plain");
        res.end("500 Internal Server Error");
      }
    }
  } catch (err: any) {
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`AnyLinux Metadata Portal running at http://localhost:${PORT}/`);
  console.log(`Serving web assets from: ${webDir}`);
});
