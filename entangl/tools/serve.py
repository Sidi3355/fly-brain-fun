#!/usr/bin/env python3
"""Serve a site folder the way entangl.com's host (Cloudflare static assets) does.

  /platform             307 -> /platform/
  /platform/            200  platform/index.html
  /platform/index.html  307 -> /platform/
  /platform.html        307 -> /platform/
  /404                  200  404.html
  /missing              404  404.html
  _headers              rules applied to matching paths

Usage: python3 serve.py SITE_DIR [PORT]   (default port 8000)
"""
import fnmatch, mimetypes, sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

mimetypes.add_type("image/webp", ".webp")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("text/javascript", ".js")


def load_headers(root):
    rules, current = [], None
    f = root / "_headers"
    if f.exists():
        for line in f.read_text().splitlines():
            if not line.strip():
                continue
            if not line[0].isspace():
                current = (line.strip(), [])
                rules.append(current)
            elif current and ":" in line:
                k, v = line.strip().split(":", 1)
                current[1].append((k.strip(), v.strip()))
    return rules


class Handler(BaseHTTPRequestHandler):
    root: Path
    rules: list

    def log_message(self, fmt, *args):
        sys.stderr.write("%s %s\n" % (self.command, fmt % args))

    def resolve(self, path):
        """Return (status, file or redirect target)."""
        root = self.root
        if path.endswith("/index.html"):
            return 307, path[: -len("index.html")]
        if path.endswith(".html"):
            stem = path[:-5]
            if (root / stem.lstrip("/") / "index.html").is_file():
                return 307, stem + "/"
            if (root / path.lstrip("/")).is_file():
                return 307, stem  # /404.html -> /404
        rel = path.lstrip("/")
        target = root / rel
        if path.endswith("/"):
            idx = target / "index.html"
            return (200, idx) if idx.is_file() else (404, None)
        if target.is_file():
            return 200, target
        if (target / "index.html").is_file():
            return 307, path + "/"
        if (root / (rel + ".html")).is_file():
            return 200, root / (rel + ".html")
        return 404, None

    def send_file(self, status, file, head):
        body = file.read_bytes() if file else b""
        ctype = mimetypes.guess_type(file.name)[0] if file else "text/html"
        if ctype and (ctype.startswith("text/") or ctype.endswith(("javascript", "xml", "json"))):
            ctype += "; charset=utf-8" if "html" not in ctype else ""
        if file and file.name == "_headers":
            ctype = "application/octet-stream"
        self.send_response(status)
        self.send_header("Content-Type", ctype or "application/octet-stream")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "public, max-age=0, must-revalidate")
        for pattern, headers in self.rules:
            if fnmatch.fnmatch(self.req_path, pattern):
                for k, v in headers:
                    self.send_header(k, v)
        self.end_headers()
        if not head:
            self.wfile.write(body)

    def handle_request(self, head=False):
        url = urlsplit(self.path)
        self.req_path = unquote(url.path) or "/"
        if ".." in self.req_path.split("/"):
            return self.send_error(400)
        status, res = self.resolve(self.req_path)
        if status == 307:
            self.send_response(307)
            self.send_header("Location", res + (f"?{url.query}" if url.query else ""))
            self.send_header("Content-Length", "0")
            self.end_headers()
        elif status == 200:
            self.send_file(200, res, head)
        else:
            page = self.root / "404.html"
            self.send_file(404, page if page.is_file() else None, head)

    def do_GET(self):
        self.handle_request()

    def do_HEAD(self):
        self.handle_request(head=True)


def main():
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    port = int(sys.argv[2]) if len(sys.argv) > 2 else 8000
    Handler.root, Handler.rules = root, load_headers(root)
    print(f"Serving {root} at http://localhost:{port}/")
    ThreadingHTTPServer(("", port), Handler).serve_forever()


if __name__ == "__main__":
    main()
