"""Rebuild structured data (JSON-LD) and meta tags for the homepage and pricing page.
Run from the repo root:  python3 scripts/seo.py
FAQ markup is generated from the <details> blocks on each page, so it always matches the visible text."""
import json, re, html

SITE = "https://sokolsystems.io"
ORG = {
  "@type": "Organization", "@id": SITE + "/#org", "name": "Sokol Systems", "url": SITE + "/",
  "logo": SITE + "/icon-512.png", "image": SITE + "/social-preview.jpg?v=2", "email": "marinko@sokolsystems.io",
  "description": "Ad creative subscription that turns a brand’s best-performing ads and social posts into new variations (hooks, angles and formats), plus product photography, UGC-style content and edited short-form video, for one flat monthly rate.",
  "founder": {"@type": "Person", "@id": SITE + "/#marinko", "name": "Marinko Rudela", "jobTitle": "Founder"},
  "sameAs": ["https://www.instagram.com/sokolsystems/", "https://www.facebook.com/100597089629413"],
}
WEBSITE = {"@type": "WebSite", "@id": SITE + "/#website", "url": SITE + "/", "name": "Sokol Systems", "publisher": {"@id": SITE + "/#org"}, "inLanguage": "en"}
SERVICE = {
  "@type": "Service", "@id": SITE + "/#service", "name": "Ad creative subscription",
  "serviceType": "Advertising creative production",
  "description": "Unlimited requests, produced one at a time: new versions of your best-performing ads (hooks, angles, formats and sizes), product shots, photography, UGC-style video, Reels and social posts. Each request delivered within 24 hours, Monday to Friday. No contract.",
  "provider": {"@id": SITE + "/#org"}, "url": SITE + "/pricing",
  "offers": {"@type": "Offer", "price": "2995", "priceCurrency": "USD", "url": SITE + "/pricing",
             "priceSpecification": {"@type": "UnitPriceSpecification", "price": "2995", "priceCurrency": "USD", "unitText": "MONTH", "referenceQuantity": {"@type": "QuantitativeValue", "value": 1, "unitCode": "MON"}}},
}

def text(fragment):
    t = re.sub(r"<[^>]+>", "", fragment)
    return html.unescape(re.sub(r"\s+", " ", t)).strip()

def faq(page_html):
    items = re.findall(r"<details><summary>(.*?)</summary><p>(.*?)</p></details>", page_html, re.S)
    return {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": text(q), "acceptedAnswer": {"@type": "Answer", "text": text(a)}} for q, a in items]}

def put_ld(s, graph):
    block = '<script type="application/ld+json">' + json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, separators=(",", ":")) + "</script>"
    if '<script type="application/ld+json">' in s:
        return re.sub(r'<script type="application/ld\+json">.*?</script>', lambda m: block, s, count=1, flags=re.S)
    return s.replace("</head>", block + "\n</head>", 1)

def set_meta(s, title, desc):
    s = re.sub(r"<title>.*?</title>", lambda m: f"<title>{title}</title>", s, 1)
    for attr in ('name="description"', 'property="og:description"', 'name="twitter:description"'):
        s = re.sub(r'(<meta ' + attr + r' content=")[^"]*(")', lambda m: m.group(1) + html.escape(desc, quote=True) + m.group(2), s, 1)
    for attr in ('property="og:title"', 'name="twitter:title"'):
        s = re.sub(r'(<meta ' + attr + r' content=")[^"]*(")', lambda m: m.group(1) + html.escape(title, quote=True) + m.group(2), s, 1)
    return s

pages = {
  "index.html": dict(
    title="Sokol Systems — Ad Creative Subscription Built on Your Winners",
    desc="Send us your best ads and posts. We turn them into new hooks, angles and formats, plus product shots and UGC-style video, in 24 hours. No contract.",
    graph=lambda s: [ORG, WEBSITE, SERVICE, dict({"@type": "WebPage", "@id": SITE + "/#webpage", "url": SITE + "/", "name": "Sokol Systems", "isPartOf": {"@id": SITE + "/#website"}, "about": {"@id": SITE + "/#service"}}), faq(s)]),
  "pricing.html": dict(
    title="Ad Creative Subscription Pricing — Sokol Systems",
    desc="$2,995 a month for ads built from your winners, product shots, photography and UGC-style video, in 24 hours. No contract. See how it compares.",
    graph=lambda s: [ORG, SERVICE,
      {"@type": "WebPage", "@id": SITE + "/pricing#webpage", "url": SITE + "/pricing", "name": "Pricing", "isPartOf": {"@id": SITE + "/#website"}, "about": {"@id": SITE + "/#service"}},
      {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"}, {"@type": "ListItem", "position": 2, "name": "Pricing", "item": SITE + "/pricing"}]},
      faq(s)]),
}
for f, cfg in pages.items():
    s = open(f, encoding="utf-8").read()
    s = set_meta(s, cfg["title"], cfg["desc"])
    s = put_ld(s, cfg["graph"](s))
    open(f, "w", encoding="utf-8").write(s)
    print(f, len(cfg["title"]), len(cfg["desc"]))
