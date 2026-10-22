"""Build the blog, RSS feed, sitemap and llms.txt.

Add a post: create content/blog/<slug>.html starting with a <!--meta {...}--> JSON block
(slug, title, seo_title, description, category, date, updated), then the article body HTML.
Run from the repo root:  python3 scripts/blog.py
"""
import json, re, html, glob, datetime, math, os, sys
sys.path.insert(0, "content")
from industries_data import INDUSTRIES

SITE = "https://sokolsystems.io"
AUTHOR = {"name": "Marinko Rudela", "bio": "Marinko Rudela runs Sokol Systems, an ad creative subscription that builds new versions of brands’ best-performing ads, plus product shots, photography and UGC-style video."}
STRIPE = "https://buy.stripe.com/8x2eVd5SX3767u5b2W5Ne00"
OG_IMAGE = SITE + "/social-preview.jpg?v=2"
STATIC_PAGES = [("/", 1.0), ("/pricing", 0.8), ("/implementation", 0.8), ("/industries", 0.7), ("/blog", 0.7), ("/terms", 0.3), ("/privacy", 0.3)]
NEW_PAGES_DATE = "2026-10-20"

def esc(s):
    return html.escape(s, quote=True)

def nice_date(d):
    return datetime.date.fromisoformat(d).strftime("%-d %B %Y")

def head(title, desc, path, og_type="website", extra=""):
    url = SITE + path
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="{url}">
<meta name="theme-color" content="#FBF6EE">
<meta property="og:type" content="{og_type}">
<meta property="og:site_name" content="Sokol Systems">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{OG_IMAGE}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Sokol Systems — send us your winners, we’ll make them champions">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(title)}">
<meta name="twitter:description" content="{esc(desc)}">
<meta name="twitter:image" content="{OG_IMAGE}">
{extra}<link rel="alternate" type="application/rss+xml" title="Sokol Systems blog" href="/blog/feed.xml">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/hanken-grotesk.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/young-serif.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/styles.css">
"""

NAV = """<a class="skip" href="#main">Skip to content</a>
<header class="site-nav">
  <div class="nav">
    <nav aria-label="Main"><ul>
      <li><a href="/#work">Our work</a></li>
      <li><a href="/#how">How it works</a></li>
      <li><a href="/pricing">Pricing</a></li>
      <li><a href="/implementation">Implementation</a></li>
      <li><a href="/industries">Industries</a></li>
      <li><a href="/blog" aria-current="page">Blog</a></li>
      <li><a href="/#faq">FAQ</a></li>
    </ul></nav>
    <a class="mark" href="/" aria-label="Sokol Systems home"><img src="/media/46eded87-b4c3-40a7-aac9-ff9a2842df7d.webp" alt="" width="34" height="34">Sokol Systems</a>
    <a class="btn btn-main" href="%s">Start your subscription</a>
  </div>
</header>
""" % STRIPE

FOOT = """<footer>
  <div class="wrap">
    <ul class="foot-links">
      <li><a href="%s">Start your subscription</a></li>
      <li><a href="/pricing">Pricing</a></li>
      <li><a href="/implementation">Implementation</a></li>
      <li><a href="/industries">Industries</a></li>
      <li><a href="/blog">Blog</a></li>
      <li><a href="/#faq">FAQ</a></li>
      <li><a href="/#contact">Contact</a></li>
      <li><a href="https://billing.stripe.com/p/login/8x2eVd5SX3767u5b2W5Ne00">Billing portal</a></li>
    </ul>
    <div class="legal">
      <span>© 2026 Sokol Systems</span>
      <ul>
        <li><a href="/terms">Terms of Service</a></li>
        <li><a href="/privacy">Privacy Policy</a></li>
        <li><button type="button" id="cookie-settings">Cookie settings</button></li>
        <li><a href="mailto:marinko@sokolsystems.io">marinko@sokolsystems.io</a></li>
        <li><a href="https://www.instagram.com/sokolsystems/" rel="me noopener">Instagram</a></li>
        <li><a href="https://www.facebook.com/100597089629413" rel="me noopener">Facebook</a></li>
      </ul>
    </div>
  </div>
  <div class="scene" role="img" aria-label="Painting of a sunlit coastline with a falcon soaring over the sea">
    <p>Winners into champions. <em>Made for every feed.</em></p>
  </div>
</footer>
<div class="consent" id="consent" role="dialog" aria-live="polite" aria-label="Cookie preferences" hidden>
  <p>We use privacy-friendly analytics to see which pages are useful.<span class="consent-ads"> With “Allow all”, we also use Meta’s pixel to measure our ads, which shares your visit with Meta.</span> Is that OK? <a href="/privacy#analytics">Details</a></p>
  <div class="row2">
    <button type="button" class="btn btn-main" data-consent="all">Allow all</button>
    <button type="button" class="btn btn-ghost" data-consent="accept">Analytics only</button>
    <button type="button" class="btn btn-ghost" data-consent="decline">Decline</button>
  </div>
</div>
<script src="/main.js" defer></script>
</body>
</html>
""" % STRIPE

def ld(obj):
    return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False, separators=(",", ":")) + "</script>\n"

def label_tables(body):
    """Give each table cell a data-label from its column header, so tables can stack on phones."""
    def one(m):
        t = m.group(0)
        heads = [re.sub(r"<[^>]+>", "", h).strip() for h in re.findall(r"<th[^>]*>(.*?)</th>", re.search(r"<thead>(.*?)</thead>", t, re.S).group(1), re.S)]
        def row(r):
            i = [0]
            def cell(c):
                k = i[0]; i[0] += 1
                if c.group(1) == "td" and k < len(heads):
                    return f'<td data-label="{esc(heads[k])}"'
                return c.group(0)
            return re.sub(r"<(td|th)(?=[\s>])", cell, r.group(0))
        return re.sub(r"<tr>.*?</tr>", row, t, flags=re.S) if "<thead>" in t else t
    return re.sub(r"<table>.*?</table>", one, body, flags=re.S)

def load_posts():
    posts = []
    for f in sorted(glob.glob("content/blog/*.html")):
        raw = open(f, encoding="utf-8").read()
        m = re.match(r"\s*<!--meta\s*(\{.*?\})\s*-->\s*(.*)", raw, re.S)
        meta = json.loads(m.group(1)); body = m.group(2).strip()
        words = len(re.sub(r"<[^>]+>", " ", body).split())
        meta.update(body=label_tables(body), words=words, minutes=max(1, math.ceil(words / 220)))
        posts.append(meta)
    posts.sort(key=lambda p: (p["date"], p["slug"]), reverse=True)
    return posts

def post_page(p, posts):
    path = "/blog/" + p["slug"]
    graph = {"@context": "https://schema.org", "@graph": [
        {"@type": "BlogPosting", "@id": SITE + path + "#post", "headline": p["title"], "description": p["description"],
         "datePublished": p["date"], "dateModified": p["updated"], "url": SITE + path, "mainEntityOfPage": SITE + path,
         "image": OG_IMAGE, "inLanguage": "en", "wordCount": p["words"], "articleSection": p["category"],
         "author": {"@type": "Person", "@id": SITE + "/#marinko", "name": AUTHOR["name"], "jobTitle": "Founder", "worksFor": {"@id": SITE + "/#org"}},
         "publisher": {"@type": "Organization", "@id": SITE + "/#org", "name": "Sokol Systems", "logo": {"@type": "ImageObject", "url": SITE + "/icon-512.png"}},
         "isPartOf": {"@id": SITE + "/blog#blog"}},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": "Blog", "item": SITE + "/blog"},
            {"@type": "ListItem", "position": 3, "name": p["title"], "item": SITE + path}]}]}
    extra = (f'<meta property="article:published_time" content="{p["date"]}">\n'
             f'<meta property="article:modified_time" content="{p["updated"]}">\n'
             f'<meta property="article:author" content="{AUTHOR["name"]}">\n' + ld(graph))
    others = [o for o in posts if o["slug"] != p["slug"]][:2]
    more = "".join(card(o) for o in others)
    updated = "" if p["updated"] == p["date"] else f' · Updated <time datetime="{p["updated"]}">{nice_date(p["updated"])}</time>'
    t = p["seo_title"] + " | Sokol Systems"
    return (head(t if len(t) <= 65 else p["seo_title"], p.get("meta", p["description"]), path, "article", extra)
        + '</head>\n<body class="page blog-page">\n' + NAV.replace(' aria-current="page"', ' aria-current="true"') + f"""<main id="main">
<article class="post">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/blog">Blog</a></nav>
  <p class="post-kicker">{esc(p["category"])}</p>
  <h1>{esc(p["title"])}</h1>
  <p class="post-dek">{esc(p["description"])}</p>
  <p class="post-meta">By <a href="#author">{AUTHOR["name"]}</a> · <time datetime="{p["date"]}">{nice_date(p["date"])}</time>{updated} · {p["minutes"]} min read</p>
  <div class="post-body">
{p["body"]}
  </div>
  <aside class="post-author" id="author">
    <img src="/media/46eded87-b4c3-40a7-aac9-ff9a2842df7d.webp" alt="" width="56" height="56" loading="lazy">
    <div><p class="post-author-name">{AUTHOR["name"]}</p><p>{AUTHOR["bio"]}</p></div>
  </aside>
  <aside class="post-cta">
    <h2>Got an ad that’s carrying your account? <em>That’s where we start.</em></h2>
    <p>Send us your best-performing ads and posts. We build new hooks, angles and formats on them, plus product shots and UGC-style video, each delivered within 48 hours. No contract.</p>
    <div class="post-cta-row"><a class="btn btn-main" href="/pricing">See pricing</a><a class="post-cta-link" href="/#how">How it works</a></div>
  </aside>
</article>
<section class="post-more" aria-labelledby="more-h">
  <div class="wrap">
    <h2 id="more-h">More from the blog</h2>
    <ul class="post-cards">{more}</ul>
  </div>
</section>
</main>
""" + FOOT)

def card(p, h="h3"):
    return (f'\n      <li class="post-card"><a href="/blog/{p["slug"]}"><span class="post-kicker">{esc(p["category"])}</span>'
            f'<{h}>{esc(p["title"])}</{h}><p>{esc(p["description"])}</p>'
            f'<span class="post-card-meta"><time datetime="{p["date"]}">{nice_date(p["date"])}</time> · {p["minutes"]} min read</span></a></li>')

def index_page(posts):
    desc = "Research and practical notes on ad creative from Sokol Systems: what’s working in paid ads, what creative costs, and how to build on your best ads."
    graph = {"@context": "https://schema.org", "@graph": [
        {"@type": "Blog", "@id": SITE + "/blog#blog", "url": SITE + "/blog", "name": "Sokol Systems blog", "description": desc,
         "publisher": {"@id": SITE + "/#org"}, "inLanguage": "en",
         "blogPost": [{"@type": "BlogPosting", "headline": p["title"], "url": SITE + "/blog/" + p["slug"], "datePublished": p["date"]} for p in posts]},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": "Blog", "item": SITE + "/blog"}]}]}
    cards = "".join(card(p, "h2") for p in posts)
    return (head("Blog: Ad Creative Research and Notes | Sokol Systems", desc, "/blog", extra=ld(graph))
        + '</head>\n<body class="page blog-page">\n' + NAV + f"""<main id="main">
<section class="blog-top center">
  <div class="wrap">
    <span class="ribbon">Blog</span>
    <h1 class="pr-h1">Notes on ads <em>that keep working.</em></h1>
    <p class="lede mt">Research and practical notes on ad creative: what we find in real ad accounts, what creative costs, and how to build on the ads that already work.</p>
  </div>
</section>
<section class="blog-list" aria-label="Posts">
  <div class="wrap">
    <ul class="post-cards">{cards}</ul>
    <p class="blog-feed"><a href="/blog/feed.xml">Follow by RSS</a></p>
  </div>
</section>
</main>
""" + FOOT)

def feed(posts):
    items = "".join(
        f"""  <item>
    <title>{esc(p["title"])}</title>
    <link>{SITE}/blog/{p["slug"]}</link>
    <guid isPermaLink="true">{SITE}/blog/{p["slug"]}</guid>
    <pubDate>{datetime.datetime.fromisoformat(p["date"] + "T09:00:00+00:00").strftime("%a, %d %b %Y %H:%M:%S +0000")}</pubDate>
    <description>{esc(p["description"])}</description>
  </item>
""" for p in posts)
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Sokol Systems blog</title>
  <link>{SITE}/blog</link>
  <atom:link href="{SITE}/blog/feed.xml" rel="self" type="application/rss+xml"/>
  <description>Research and practical notes on ad creative from Sokol Systems.</description>
  <language>en</language>
{items}</channel>
</rss>
"""

def sitemap(posts):
    today = max([p["updated"] for p in posts] + ["2026-10-19"])
    def lastmod(path):
        if path == "/industries": return NEW_PAGES_DATE
        if path == "/implementation": return "2026-10-21"
        return NEW_PAGES_DATE if path in ("/", "/pricing", "/blog") else "2026-10-15"
    rows = [f"  <url><loc>{SITE}{path}</loc><lastmod>{lastmod(path)}</lastmod><priority>{pr}</priority></url>" for path, pr in STATIC_PAGES]
    rows += [f"  <url><loc>{SITE}/for/{i['slug']}</loc><lastmod>{NEW_PAGES_DATE}</lastmod><priority>0.6</priority></url>" for i in INDUSTRIES]
    rows += [f"  <url><loc>{SITE}/blog/{p['slug']}</loc><lastmod>{p['updated']}</lastmod><priority>0.6</priority></url>" for p in posts]
    return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(rows) + "\n</urlset>\n"

def llms(posts):
    lines = [
        "# Sokol Systems",
        "",
        "> Sokol Systems is an ad creative subscription. Brands send their best-performing ads and social posts, and Sokol turns them into new versions (new hooks, angles, formats and sizes), plus product shots, photography, UGC-style video, edited Reels and social posts.",
        "",
        "Key facts:",
        "- Price: $2,995 per month, one plan. No contract; pause or cancel anytime.",
        "- Unlimited requests, produced one at a time. Each request is delivered within 48 hours, Monday to Friday (US Eastern Time).",
        "- Unlimited revisions. Clients own everything delivered.",
        "- Sokol does not need access to a client's ad account and does not guarantee ad performance.",
        "- A human creative director owns strategy and quality; AI production tools handle the slow parts of production.",
        "- Also offered: building and installing a custom AI creative system inside a client's own business (scoped and quoted on an implementation call; no public price).",
        "- Founder: Marinko Rudela. Contact: marinko@sokolsystems.io",
        "",
        "## Pages",
        f"- [Home]({SITE}/): what Sokol does, sample work, how it works, and what an equivalent in-house team costs",
        f"- [Pricing]({SITE}/pricing): the plan, an example month, and a sourced comparison with freelancers, design subscriptions, an in-house team and agencies",
        f"- [Implementation]({SITE}/implementation): building a custom AI creative system inside a client's own business (brand setup, consistent characters, production workflows, approvals, training); scoped and quoted on a call",
        f"- [Industries]({SITE}/industries): the industries Sokol makes ad creative for, with a page for each",
        f"- [Blog]({SITE}/blog): research and notes on ad creative",
        "",
        "## Industry pages",
    ] + [f"- [Ad creative for {i['label']}]({SITE}/for/{i['slug']}): {i['description']}" for i in INDUSTRIES] + [
        "",
        "## Blog posts",
    ] + [f"- [{p['title']}]({SITE}/blog/{p['slug']}): {p['description']}" for p in posts] + [
        "",
        "## Optional",
        f"- [Terms of Service]({SITE}/terms)",
        f"- [Privacy Policy]({SITE}/privacy)",
        "",
    ]
    return "\n".join(lines)

if __name__ == "__main__":
    posts = load_posts()
    os.makedirs("blog", exist_ok=True)
    for p in posts:
        open(f"blog/{p['slug']}.html", "w", encoding="utf-8").write(post_page(p, posts))
    open("blog/index.html", "w", encoding="utf-8").write(index_page(posts))
    open("blog/feed.xml", "w", encoding="utf-8").write(feed(posts))
    open("sitemap.xml", "w", encoding="utf-8").write(sitemap(posts))
    open("llms.txt", "w", encoding="utf-8").write(llms(posts))
    for p in posts:
        print(p["slug"], p["words"], "words", p["minutes"], "min", len(p["seo_title"]), "title chars", len(p.get("meta", p["description"])), "meta desc chars")
