#!/usr/bin/env python3
"""Mirror entangl.com into a static folder, byte for byte.

Follows every same-origin reference it can find: sitemap entries, HTML
href/src/srcset/poster/content attributes, CSS url()/@import, and string
literals in JS that look like site paths (so files fetched at runtime are
included). URL paths ending in "/" are saved as <path>/index.html, which is how
the live host (Cloudflare static assets, auto-trailing-slash) serves them.

Usage: python3 mirror.py OUT_DIR [--origin https://entangl.com]
"""
import argparse, json, re, sys, urllib.parse, urllib.request
from collections import deque
from pathlib import Path

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36"
ATTR = re.compile(r'''(?:href|src|poster|content|action|data-[\w-]+)\s*=\s*["']([^"']+)["']''', re.I)
SRCSET = re.compile(r'''srcset\s*=\s*["']([^"']+)["']''', re.I)
CSSURL = re.compile(r'''url\(\s*["']?([^"')]+)["']?\s*\)|@import\s+["']([^"']+)["']''', re.I)
JSPATH = re.compile(r'''["'`](/(?:assets|reports|data|fonts|img|images|media|video|downloads)/[^"'`\s?#]+)''')
JSPAGE = re.compile(r'''["'`](/[a-z0-9][a-z0-9\-/]*/?)(?:[?#][^"'`]*)?["'`]''')


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, r.headers.get("content-type", ""), r.read(), r.geturl()
    except urllib.error.HTTPError as e:
        return e.code, e.headers.get("content-type", ""), e.read(), url


# Cloudflare's bot-management snippet is added by the CDN to every HTML
# response (with a per-request token). It is not part of the site's source and
# is re-added when the mirror is deployed behind Cloudflare, so drop it.
CF_JSD = re.compile(rb"<script>\(function\(\)\{function c\(\)\{var b=a\.contentDocument.*?window\.__CF\$cv\$params.*?\}\)\(\);</script>", re.S)


def strip_cdn_injection(body):
    return CF_JSD.sub(b"", body)


def local_path(out, path):
    path = urllib.parse.unquote(path)
    if path.endswith("/"):
        path += "index.html"
    return out / path.lstrip("/")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("--origin", default="https://entangl.com")
    a = ap.parse_args()
    out, origin = Path(a.out), a.origin.rstrip("/")
    host = urllib.parse.urlparse(origin).netloc

    seeds = ["/", "/robots.txt", "/sitemap.xml", "/_headers", "/404"]
    _, _, sm, _ = fetch(origin + "/sitemap.xml")
    seeds += [urllib.parse.urlparse(u).path for u in re.findall(r"<loc>([^<]+)</loc>", sm.decode())]

    _, _, hd, _ = fetch(origin + "/_headers")
    for line in hd.decode().splitlines():
        if line.startswith("/"):
            seeds.append(line.strip().rstrip("*"))

    seen, queue, log = set(), deque(seeds), {}
    while queue:
        path = queue.popleft()
        if path in seen or path.startswith("/cdn-cgi/") or "${" in path:
            continue
        seen.add(path)
        status, ctype, body, final = fetch(origin + path)
        fpath = urllib.parse.urlparse(final).path
        if fpath != path:  # redirect (e.g. /platform -> /platform/)
            log[path] = {"status": "redirect", "to": fpath}
            queue.append(fpath)
            continue
        log[path] = {"status": status, "type": ctype, "bytes": len(body)}
        if status != 200 and path != "/404":
            print(f"  {status} {path}", file=sys.stderr)
            continue
        dest = out / "404.html" if path == "/404" else local_path(out, path)
        dest.parent.mkdir(parents=True, exist_ok=True)
        if "html" in ctype:
            body = strip_cdn_injection(body)
        dest.write_bytes(body)
        print(f"{status} {len(body):>8} {path}")

        text = body.decode("utf-8", "ignore") if re.search(r"html|css|javascript|json|xml|svg|text", ctype) else ""
        refs = []
        if "html" in ctype or "svg" in ctype:
            refs += ATTR.findall(text)
            for s in SRCSET.findall(text):
                refs += [p.strip().split(" ")[0] for p in s.split(",")]
            refs += [m[0] or m[1] for m in CSSURL.findall(text)]  # inline <style>
            refs += JSPATH.findall(text)
        if "css" in ctype:
            refs += [m[0] or m[1] for m in CSSURL.findall(text)]
        if "javascript" in ctype or "json" in ctype:
            refs += JSPATH.findall(text) + JSPAGE.findall(text)
        for ref in refs:
            ref = ref.strip()
            if ref.startswith(("data:", "mailto:", "tel:", "javascript:", "#")) or re.search(r"[\s=,]", ref):
                continue  # meta content values, attribute text, not URLs
            if "/" not in ref and "." not in ref:
                continue
            u = urllib.parse.urlparse(urllib.parse.urljoin(origin + path, ref))
            if u.netloc != host or not u.path:
                continue
            if u.path not in seen:
                queue.append(u.path)

    (out.parent / "mirror-log.json").write_text(json.dumps(log, indent=1, sort_keys=True))


if __name__ == "__main__":
    main()
