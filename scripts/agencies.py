"""Build for/agencies.html (white-label creative for marketing agencies).

Run from the repo root:  python3 scripts/agencies.py   (then python3 scripts/blog.py for sitemap and llms.txt)
Shares the head, nav and footer with the other pages (scripts/blog.py) and the sample-work cards
with the industry pages (scripts/industries.py). The call to action is a free sample, sent through
the contact form API (topic=agency-sample), not the subscription checkout: agencies want to judge
the work on a real client ad before they pay.
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__)); sys.path.insert(0, "content")
import blog
import industries
from blog import SITE, STRIPE, esc

PATH = "/for/agencies"
TITLE = "White-Label Ad Creative for Agencies | Sokol Systems"
DESC = ("White-label ad creative for agencies: new versions of your clients' winning ads, photos and video, "
        "24-hour delivery, unlimited brands, $1,495 a month.")

SAMPLES = ["ugc-serum-selfie", "burger-ad", "coffee-meme-post", "car-suv-ad"]

PAINS = [
    ("Launching is fast. Creative isn’t.",
     "Your team can build a campaign in an afternoon. New creative for it takes days, and ad fatigue doesn’t wait."),
    ("Every client wants fresh ads this week",
     "Ten accounts each need new versions at once, and your designers and editors are already booked."),
    ("Hiring for the peaks costs too much",
     "A designer, a video editor and UGC creators on payroll cost far more than the busy weeks are worth."),
]

WHITE = [
    ("Your name, not ours",
     "No Sokol logo, watermark or mention in the files. Present the work to your clients as your own."),
    ("Unlimited brands",
     "Add every client as a brand in your portal. Each one gets its own brand profile and its own Drive folder."),
    ("We study each brand first",
     "Before the first request for a brand, we research its website and current ads, so you don’t brief from scratch."),
    ("One portal for every client",
     "Send requests per brand, track progress, approve deliveries and filter by client, all in one place."),
    ("Organized per brand",
     "Each brand’s folder holds its Brand Assets and Deliveries, named clearly, so you can hand files straight to your client."),
    ("We only talk to you",
     "We never contact your clients. Briefs, feedback and approvals all go through your team."),
]

STEPS = [
    ("Add a brand", "Enter the client’s name and website in your portal. Setting it up takes one turn in your queue."),
    ("Send a winner", "Their best-performing ad or post, and what you want: new hooks, new formats or fresh visuals."),
    ("Get versions in 24 hours", "Every size, each file named for the one thing it changes, with a short test guide."),
    ("Run, then repeat", "Your client runs the new versions. The one that wins becomes the next thing we build on."),
]

FAQ = [
    ("Is it really white-label?",
     "Yes. Delivered files carry no Sokol name, logo or watermark, and you can present, resell or hand them to your clients as your own work. We never contact your clients."),
    ("How many brands can we add?",
     "As many as you like. Every subscription includes unlimited brands, each with its own brand profile and Drive folder. Archive a brand when you stop working with that client, and restore it if they come back."),
    ("How many requests do we get?",
     "Unlimited requests, produced one at a time across all your brands. Each is delivered within 24 hours of when we start it, Monday to Friday, so a full queue is around 20 requests a month. Setting up a new brand takes one of those turns while we research it and build its profile."),
    ("What counts as one request?",
     "One piece of work: one ad concept in every size (with up to five hook or headline versions), one video up to 60 seconds (with up to five hook versions), one carousel, or one set of up to five photos. A bigger ask is split into several requests in your queue, and we tell you before we start."),
    ("What do you need for each brand?",
     "Its website, and ideally its logo files, a few product photos and its best-performing ads. You confirm you have your client’s permission to share their materials with us, and the consent of anyone whose face or voice you want us to use."),
    ("Who owns the work?",
     "You do, and you can pass it on to your clients. We only show work in our portfolio with your permission, and we keep your clients’ materials confidential."),
    ("Do you use AI?",
     "Yes. We combine AI image and video tools with human creative direction, and a person reviews every piece before it’s delivered."),
    ("Can our clients use the portal?",
     "The portal is for your team, because it shows all your brands. You can share a single brand’s Drive folder with that client if you want them to see their files."),
    ("What’s in the free sample?",
     "Three new versions of one winning ad from one of your clients, so you can judge the quality on real work before you pay anything. One per agency, no card needed."),
]


def ld():
    graph = [
        {"@type": "Service", "@id": SITE + PATH + "#service", "name": "White-label ad creative for marketing agencies",
         "serviceType": "Advertising creative production",
         "description": "White-label creative subscription for agencies: new versions of clients' best-performing ads, product photography, UGC-style video and Reels, with unlimited brands and 24-hour delivery per request.",
         "provider": {"@id": SITE + "/#org"}, "url": SITE + PATH, "areaServed": "Worldwide",
         "audience": {"@type": "BusinessAudience", "name": "Marketing agencies"},
         "offers": {"@type": "Offer", "price": "1495", "priceCurrency": "USD", "url": SITE + "/pricing",
                    "priceSpecification": {"@type": "UnitPriceSpecification", "price": "1495", "priceCurrency": "USD", "unitText": "MONTH",
                                           "referenceQuantity": {"@type": "QuantitativeValue", "value": 1, "unitCode": "MON"}}}},
        {"@type": "WebPage", "@id": SITE + PATH + "#webpage", "url": SITE + PATH, "name": TITLE,
         "isPartOf": {"@id": SITE + "/#website"}, "about": {"@id": SITE + PATH + "#service"}},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": "For agencies", "item": SITE + PATH}]},
        {"@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in FAQ]},
    ]
    return '<script type="application/ld+json">' + json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False) + "</script>\n"


def page():
    nav = blog.NAV.replace(' aria-current="page"', "")
    gallery = "".join(industries.figure(k) for k in SAMPLES)
    pains = "".join(f"<li><h3>{esc(h)}</h3><p>{esc(p)}</p></li>" for h, p in PAINS)
    white = "".join(f"<li><h3>{esc(h)}</h3><p>{esc(p)}</p></li>" for h, p in WHITE)
    steps = "".join(f"<li><h3>{esc(h)}</h3><p>{esc(p)}</p></li>" for h, p in STEPS)
    faq = "".join(f"<details><summary>{esc(q)}</summary><p>{esc(a)}</p></details>" for q, a in FAQ)
    return blog.head(TITLE, DESC, PATH, extra=ld()) + '</head>\n<body class="page ind-page ag-page">\n' + nav + f"""<main id="main">
<section class="ind-top center">
  <div class="wrap">
    <nav class="crumbs crumbs-c" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span>For agencies</span></nav>
    <span class="ribbon">For marketing agencies</span>
    <h1 class="pr-h1">More creative for every client. <em>Under your name.</em></h1>
    <p class="lede mt">Send us your clients’ winning ads. We turn them into new hooks, formats and visuals, delivered within 24 hours and ready to present as your own. Unlimited brands on one plan.</p>
    <div class="ind-cta"><a class="btn btn-main" href="#sample">Get a free sample</a><a class="ind-link" href="#how">How it works</a></div>
  </div>
</section>

<section class="ind-pains" aria-labelledby="pains-h">
  <div class="wrap">
    <div class="center"><h2 id="pains-h">Where agencies <em>get stuck.</em></h2></div>
    <ul class="ind-cards">{pains}</ul>
  </div>
</section>

<section class="ind-pains ag-white" aria-labelledby="white-h">
  <div class="wrap">
    <div class="center"><span class="ribbon">White-label</span><h2 id="white-h">Built to work <em>behind your brand.</em></h2></div>
    <ul class="ind-cards">{white}</ul>
  </div>
</section>

<section class="ind-work" aria-labelledby="work-h">
  <div class="wrap">
    <div class="center"><h2 id="work-h">What we make <em>for your clients.</em></h2></div>
    <ul class="ind-gallery" tabindex="0" aria-label="Sample work">{gallery}</ul>
    <p class="work-note">Sample work for concept brands, made by our studio. Your clients’ work is built from their brands and their winners.</p>
  </div>
</section>

<section class="ind-how" id="how" aria-labelledby="how-h">
  <div class="wrap">
    <div class="center"><span class="ribbon">How it works</span><h2 id="how-h">One portal. <em>Every client.</em></h2></div>
    <ol class="ind-steps impl-steps">{steps}</ol>
  </div>
</section>

<section class="ind-rules" aria-labelledby="queue-h">
  <div class="wrap">
    <div class="ind-rules-box">
      <h2 id="queue-h">How the queue works</h2>
      <p>Requests are produced one at a time across all your brands, and each is delivered within 24 hours of when we start it, Monday to Friday. Keep your queue full and that’s around 20 requests a month. Adding a new brand uses one of those turns while we research it and build its profile. Changes to delivered work always go first.</p>
    </div>
  </div>
</section>

<section id="sample" class="ag-sample" aria-labelledby="sample-h">
  <div class="wrap contact-grid">
    <div>
      <span class="ribbon">Free sample</span>
      <h2 id="sample-h">Try us on one of <em>your clients’ ads.</em></h2>
      <p class="lede mt">Send a link to one winning ad from a client. We make three new versions of it, so you can judge the quality on real work before you pay anything.</p>
      <ul class="ag-terms"><li>One free sample per agency</li><li>No card, no obligation</li><li>We reply within one business day</li></ul>
      <p class="hint">Only send ads your client is happy for you to share with us.</p>
    </div>
    <form id="contact-form" novalidate>
      <input type="hidden" name="topic" value="agency-sample">
      <div class="field"><label for="f-name">Your name</label><input id="f-name" name="name" type="text" autocomplete="name" required maxlength="80" aria-describedby="e-name"><p class="err" id="e-name" role="alert"></p></div>
      <div class="field"><label for="f-email">Work email</label><input id="f-email" name="email" type="email" autocomplete="email" required maxlength="160" aria-describedby="e-email"><p class="err" id="e-email" role="alert"></p></div>
      <div class="field"><label for="f-site">Agency website <span class="opt">(optional)</span></label><input id="f-site" name="website" type="text" inputmode="url" autocomplete="url" maxlength="200" aria-describedby="e-site"><p class="err" id="e-site" role="alert"></p></div>
      <div class="field"><label for="f-msg">The winning ad, and what to try</label><textarea id="f-msg" name="message" required maxlength="2000" aria-describedby="e-msg" placeholder="Paste a link to the ad (Meta Ad Library, Instagram, TikTok or a Drive link) and tell us what to try: new hooks, a new format or fresh visuals."></textarea><p class="err" id="e-msg" role="alert"></p></div>
      <div class="hp" aria-hidden="true"><label for="f-fax">Leave this field empty</label><input id="f-fax" name="company_fax" type="text" tabindex="-1" autocomplete="off"></div>
      <input type="hidden" name="started_at" value="">
      <button type="submit" class="btn btn-main">Request my free sample</button>
      <p class="form-status" role="status" aria-live="polite"></p>
      <p class="form-note">We only use your details to reply and make your sample. See our <a href="/privacy">privacy policy</a>.</p>
    </form>
  </div>
</section>

<section class="ind-faq" id="faq" aria-labelledby="faq-h">
  <div class="wrap">
    <div class="center"><h2 id="faq-h">Questions from <em>agencies.</em></h2></div>
    <div class="faq mt40">{faq}</div>
  </div>
</section>

<section class="ind-plan" aria-labelledby="plan-h">
  <div class="wrap">
    <div class="ind-plan-box">
      <div>
        <h2 id="plan-h">One plan. <em>Unlimited brands.</em></h2>
        <p>$1,495 a month for unlimited requests across all your clients, produced one at a time, each delivered within 24 hours. No contract; pause or cancel anytime.</p>
      </div>
      <div class="ind-plan-cta"><a class="btn btn-main" href="{STRIPE}">Start your subscription</a><a class="ind-link" href="/pricing">See pricing and how we compare</a></div>
    </div>
  </div>
</section>
</main>
""" + blog.FOOT


if __name__ == "__main__":
    for k in SAMPLES:
        assert k in industries.CARDS and os.path.exists(f"media/work/{k}-sm.webp"), k
    os.makedirs("for", exist_ok=True)
    open("for/agencies.html", "w", encoding="utf-8").write(page())
    print("for/agencies.html", len(TITLE), "title chars", len(DESC), "desc chars")
