"""Build the industry pages (/for/<slug>) and the /industries hub from content/industries_data.py.

Run from the repo root:  python3 scripts/industries.py   (then python3 scripts/blog.py for sitemap and llms.txt)
"""
import html, json, os, re, sys
sys.path.insert(0, "scripts"); sys.path.insert(0, "content")
import blog
from industries_data import INDUSTRIES, NEW_SAMPLES

SITE, STRIPE, esc, ld = blog.SITE, blog.STRIPE, blog.esc, blog.ld
NAV = blog.NAV.replace(' aria-current="page"', "")
NAV_HUB = NAV.replace('<a href="/industries">', '<a href="/industries" aria-current="page">')
NAV_IND = NAV.replace('<a href="/industries">', '<a href="/industries" aria-current="true">')
BY_SLUG = {i["slug"]: i for i in INDUSTRIES}

def load_cards():
    """Captions for existing sample work, read from the homepage carousel."""
    s = open("index.html", encoding="utf-8").read()
    cards = {}
    for c in re.findall(r'<li class="wcard" data-c="[a-z]+"><figure><img src="/media/work/([a-z0-9-]+)-sm\.webp"[^>]*alt="([^"]*)".*?<span class="wtype">([^<]*)</span><span class="wbrand">([^<]*)</span>', s, re.S):
        cards[c[0]] = {"alt": html.unescape(c[1]), "type": html.unescape(c[2]), "brand": html.unescape(c[3])}
    cards.update(NEW_SAMPLES)
    return cards

CARDS = load_cards()

def figure(key):
    c = CARDS[key]
    return (f'<li><figure><img src="/media/work/{key}-sm.webp" srcset="/media/work/{key}-sm.webp 440w, /media/work/{key}-md.webp 560w, /media/work/{key}.webp 720w" '
            f'sizes="(max-width:600px) 78vw, 270px" width="440" height="550" alt="{esc(c["alt"])}" loading="lazy" decoding="async">'
            f'<figcaption><span class="wtype">{esc(c["type"])}</span><span class="wbrand">{esc(c["brand"].split(" · ")[0])}</span></figcaption></figure></li>')

def strip_tags(s):
    return html.unescape(re.sub(r"<[^>]+>", "", s))

def page(i):
    path = "/for/" + i["slug"]
    url = SITE + path
    label = i["label"]
    short = i["short"]
    faq_ld = [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in i["faqs"]]
    graph = {"@context": "https://schema.org", "@graph": [
        {"@type": "Service", "@id": url + "#service", "name": "Ad creative for " + label, "serviceType": "Advertising creative production",
         "description": strip_tags(i["description"]), "provider": {"@id": SITE + "/#org"}, "url": url, "areaServed": "Worldwide",
         "audience": {"@type": "BusinessAudience", "name": i["name"]},
         "offers": {"@type": "Offer", "price": "2995", "priceCurrency": "USD", "url": SITE + "/pricing",
                    "priceSpecification": {"@type": "UnitPriceSpecification", "price": "2995", "priceCurrency": "USD", "unitText": "MONTH",
                                           "referenceQuantity": {"@type": "QuantitativeValue", "value": 1, "unitCode": "MON"}}}},
        {"@type": "WebPage", "@id": url + "#webpage", "url": url, "name": i["title"], "isPartOf": {"@id": SITE + "/#website"}, "about": {"@id": url + "#service"}},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": "Industries", "item": SITE + "/industries"},
            {"@type": "ListItem", "position": 3, "name": i["name"], "item": url}]},
        {"@type": "FAQPage", "mainEntity": faq_ld}]}

    gallery = "".join(figure(k) for k in i["samples"])
    makes = "".join(f"<li>{esc(m)}</li>" for m in i["makes"])
    pains = "".join(f'<li><h3>{esc(t)}</h3><p>{esc(d)}</p></li>' for t, d in i["pains"])
    data = ""
    if i.get("stats"):
        tiles = "".join(f'<li><b>{esc(v)}</b><span>{esc(t)}</span></li>' for v, t in i["stats"]["items"])
        data = f"""
<section class="ind-data" aria-labelledby="data-h">
  <div class="wrap">
    <div class="center">
      <span class="ribbon">From the Ad Library</span>
      <h2 id="data-h">What we found in <em>{esc(short)}’ ads.</em></h2>
    </div>
    <ul class="ind-stats">{tiles}</ul>
    <p class="ind-method">{i["method"]}</p>
  </div>
</section>
"""
    rules = ""
    if i.get("rules"):
        rules = f"""
<section class="ind-rules" aria-labelledby="rules-h">
  <div class="wrap">
    <div class="ind-rules-box">
      <h2 id="rules-h">Ad rules worth knowing</h2>
      <p>{esc(i["rules"])}</p>
      <p class="ind-fine">General guidance, not legal advice. Platform rules change, so check Meta’s current Advertising Standards before you run anything.</p>
    </div>
  </div>
</section>
"""
    faqs = "".join(f"<details><summary>{esc(q)}</summary><p>{esc(a)}</p></details>" for q, a in i["faqs"])
    related = "".join(f'<li><a href="/for/{r}">{esc(BY_SLUG[r]["name"])}</a></li>' for r in i["related"])

    return (blog.head(i["title"], i["description"], path, extra=ld(graph))
        + '</head>\n<body class="page ind-page">\n' + NAV_IND + f"""<main id="main">
<section class="ind-top center">
  <div class="wrap">
    <nav class="crumbs crumbs-c" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/industries">Industries</a></nav>
    <span class="ribbon">{esc(i["ribbon"])}</span>
    <h1 class="pr-h1">{esc(i["h1"])} <em>{esc(i["h1em"])}</em></h1>
    <p class="lede mt">{esc(i["lede"])}</p>
    <div class="ind-cta"><a class="btn btn-main" href="/pricing">See pricing</a><a class="ind-link" href="#how">How it works</a></div>
  </div>
</section>

<section class="ind-work" aria-labelledby="work-h">
  <div class="wrap">
    <div class="center">
      <h2 id="work-h">What we make for <em>{esc(short)}.</em></h2>
    </div>
    <ul class="ind-gallery" tabindex="0" aria-label="Sample work">{gallery}</ul>
    <p class="work-note">Sample work for concept brands, made by our studio. Yours is built from your brand and your winners.</p>
    <ul class="ind-makes" aria-label="Examples of requests">{makes}</ul>
  </div>
</section>

<section class="ind-pains" aria-labelledby="pains-h">
  <div class="wrap">
    <div class="center">
      <h2 id="pains-h">Where {esc(short)} <em>get stuck.</em></h2>
    </div>
    <ul class="ind-cards">{pains}</ul>
  </div>
</section>
{data}
<section class="ind-how" id="how" aria-labelledby="how-h">
  <div class="wrap">
    <div class="center">
      <span class="ribbon">How it works</span>
      <h2 id="how-h">Send a winner. <em>Get champions back.</em></h2>
    </div>
    <ol class="ind-steps">
      <li><h3>Send your winner</h3><p>Your best-performing ad or post, plus anything we should know: the offer, the season, what’s changed.</p></li>
      <li><h3>We build on it</h3><p>New hooks, angles, formats and sizes, plus photos and video. Each request is delivered within 48 hours, Monday to Friday.</p></li>
      <li><h3>Run it, then repeat</h3><p>You run the new versions. The one that wins becomes the next thing we build on. No ad account access needed.</p></li>
    </ol>
  </div>
</section>
{rules}
<section class="ind-faq" id="faq" aria-labelledby="faq-h">
  <div class="wrap">
    <div class="center"><h2 id="faq-h">Questions from <em>{esc(short)}.</em></h2></div>
    <div class="faq mt40">{faqs}</div>
  </div>
</section>

<section class="ind-plan" aria-labelledby="plan-h">
  <div class="wrap">
    <div class="ind-plan-box">
      <div>
        <h2 id="plan-h">One plan. <em>Everything included.</em></h2>
        <p>$2,995 a month for unlimited requests, produced one at a time, each delivered within 48 hours. No contract; pause or cancel anytime.</p>
      </div>
      <div class="ind-plan-cta"><a class="btn btn-main" href="{STRIPE}">Start your subscription</a><a class="ind-link" href="/pricing">See pricing and how we compare</a></div>
    </div>
  </div>
</section>

<section class="ind-more" aria-labelledby="more-h">
  <div class="wrap center">
    <h2 id="more-h" class="ind-more-h">Also for</h2>
    <ul class="ind-chips">{related}<li><a href="/industries">All industries</a></li></ul>
  </div>
</section>
</main>
""" + blog.FOOT)

def hub():
    desc = "Ad creative for med spas, dental practices, gyms, restaurants, salons, real estate, car dealerships and product brands. One plan, 48-hour delivery."
    graph = {"@context": "https://schema.org", "@graph": [
        {"@type": "CollectionPage", "@id": SITE + "/industries#webpage", "url": SITE + "/industries", "name": "Industries we make ad creative for",
         "isPartOf": {"@id": SITE + "/#website"},
         "hasPart": [{"@type": "WebPage", "name": "Ad creative for " + i["label"], "url": SITE + "/for/" + i["slug"]} for i in INDUSTRIES]},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": "Industries", "item": SITE + "/industries"}]}]}
    cards = "".join(
        f'<li class="hub-card"><a href="/for/{i["slug"]}"><img src="/media/work/{i["samples"][0]}-sm.webp" width="440" height="550" alt="" '
        + ('fetchpriority="high"' if n == 0 else 'loading="lazy"' if n >= 4 else '') + ' decoding="async">'
        f'<span class="hub-txt"><b>{esc(i["name"])}</b><span>{esc(i["h1em"])}</span></span></a></li>' for n, i in enumerate(INDUSTRIES))
    return (blog.head("Ad Creative by Industry | Sokol Systems", desc, "/industries", extra=ld(graph))
        + '</head>\n<body class="page ind-page">\n' + NAV_HUB + f"""<main id="main">
<section class="ind-top center">
  <div class="wrap">
    <span class="ribbon">Industries</span>
    <h1 class="pr-h1">Ad creative for <em>your kind of business.</em></h1>
    <p class="lede mt">Same plan, same 48-hour delivery, built around how your industry advertises. Pick yours to see what we make, what we found in real ads, and the rules worth knowing.</p>
  </div>
</section>
<section class="hub" aria-label="Industries">
  <div class="wrap">
    <ul class="hub-grid">{cards}</ul>
    <p class="hub-note">Don’t see yours? We work with any business that runs ads or posts on social. <a href="/pricing">See how the plan works</a>. Run an agency? <a href="/for/agencies">See white-label creative for agencies</a>.</p>
  </div>
</section>
</main>
""" + blog.FOOT)

if __name__ == "__main__":
    os.makedirs("for", exist_ok=True)
    for i in INDUSTRIES:
        for k in i["samples"]:
            assert os.path.exists(f"media/work/{k}-sm.webp"), k
        for r in i["related"]:
            assert r in BY_SLUG, r
        open(f"for/{i['slug']}.html", "w", encoding="utf-8").write(page(i))
        print(i["slug"], len(i["title"]), "title chars", len(i["description"]), "desc chars")
    open("industries.html", "w", encoding="utf-8").write(hub())
