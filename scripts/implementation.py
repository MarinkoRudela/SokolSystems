"""Build implementation.html (the implementation offer page).

Run from the repo root:  python3 scripts/implementation.py
Shares the head, nav and footer with the blog and industry pages (scripts/blog.py).
No price is shown on purpose: implementation is scoped and quoted on a call.
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import blog
from blog import SITE, STRIPE, esc

CALL = "https://calendly.com/marinko-j4q0/sokol-systems-implementation-call"
PATH = "/implementation"
TITLE = "AI Creative System Implementation — Sokol Systems"
DESC = ("We build a custom AI creative system inside your business: brand setup, consistent "
        "characters, production workflows and approvals, handed over to your team.")

BUILD = [
    ("Your brand, set up once",
     "A brand profile with your colors, fonts, tone and approved references, so everything the system makes looks like you."),
    ("Faces and characters that stay consistent",
     "Trained models of your founder, team or brand character, made from photos you provide with their consent, so they look the same in every image and video."),
    ("Production workflows",
     "Repeatable recipes for product shots, ad variations, UGC-style video and Reels, using the AI image and video tools that fit your brand."),
    ("A request and approval pipeline",
     "One place to submit requests, see what’s in progress and approve work before anything is published."),
    ("Delivery and scheduling",
     "Finished files land organized in your shared drive, and approved posts can be queued in your social scheduler."),
    ("Playbooks and training",
     "Written step-by-step guides for every workflow, plus a walkthrough with your team."),
]

STEPS = [
    ("Book a call",
     "30 minutes. You walk us through how your business makes content today, and we see whether a system would help."),
    ("Get a blueprint",
     "If it’s a fit, we map out what to build, which tools it uses and what it will cost, before any work starts."),
    ("We build it",
     "We set up the system and test it on your real products and content until it works for your team."),
    ("Your team runs it",
     "We hand over the guides and walk your team through it, so you can make content in-house."),
]

FOR_WHO = [
    "Brands whose in-house team wants to make more content",
    "Agencies that need more production capacity",
    "Businesses that post and advertise often",
    "Teams already using AI tools without a system around them",
]

FAQ = [
    ("How much does it cost?",
     "Every build is different, so we quote after the call, once we know what you need. The call is free and there’s no obligation."),
    ("How is this different from the subscription?",
     "With the subscription, we make the content for you. With implementation, we build the system inside your business so your team makes it. Some businesses start with one and move to the other."),
    ("Do we need technical skills?",
     "No coding is needed. We set everything up and write guides your team can follow."),
    ("Which tools do you use?",
     "We start from the tools you already use and add AI image and video tools where they help. You’ll know exactly what the system uses, and what those tools cost, before we build."),
    ("Who owns what you build?",
     "You do. The system is set up on accounts in your business’s name, and everything it makes is yours."),
    ("Can you guarantee results?",
     "No one honestly can. What we build is documented, tested on your real content and set up around how your team works."),
]


def ld():
    graph = [
        {"@type": "Service", "@id": SITE + PATH + "#service", "name": "AI creative system implementation",
         "serviceType": "Marketing technology implementation",
         "description": "Building and installing a custom AI creative system inside a client's own business: brand setup, consistent characters, production workflows, request and approval pipeline, delivery and scheduling, and team training. Scoped and quoted on a call.",
         "provider": {"@id": SITE + "/#org"}, "url": SITE + PATH},
        {"@type": "WebPage", "@id": SITE + PATH + "#webpage", "url": SITE + PATH, "name": "Implementation",
         "isPartOf": {"@id": SITE + "/#website"}, "about": {"@id": SITE + PATH + "#service"}},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": "Implementation", "item": SITE + PATH}]},
        {"@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in FAQ]},
    ]
    return '<script type="application/ld+json">' + json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False) + "</script>\n"


def page():
    nav = blog.NAV.replace(' aria-current="page"', "").replace(
        '<a href="/implementation">', '<a href="/implementation" aria-current="page">')
    cards = "".join(f"<li><h3>{esc(h)}</h3><p>{esc(p)}</p></li>" for h, p in BUILD)
    steps = "".join(f"<li><h3>{esc(h)}</h3><p>{esc(p)}</p></li>" for h, p in STEPS)
    who = "".join(f"<li>{esc(w)}</li>" for w in FOR_WHO)
    faq = "".join(f"<details><summary>{esc(q)}</summary><p>{esc(a)}</p></details>" for q, a in FAQ)
    return blog.head(TITLE, DESC, PATH, extra=ld()) + '</head>\n<body class="page ind-page impl-page">\n' + nav + f"""<main id="main">
<section class="ind-top center">
  <div class="wrap">
    <nav class="crumbs crumbs-c" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span>Implementation</span></nav>
    <span class="ribbon">Implementation</span>
    <h1 class="pr-h1">Your own AI creative studio. <em>Built inside your business.</em></h1>
    <p class="lede mt">The same kind of system that produces every Sokol request, set up for your team. Connected to the tools you already use, documented step by step, and handed over so you can run it yourself.</p>
    <div class="ind-cta"><a class="btn btn-main" href="{CALL}">Book an implementation call</a><a class="ind-link" href="#build">What we build</a></div>
  </div>
</section>

<section class="impl-ways" aria-labelledby="ways-h">
  <div class="wrap">
    <div class="center"><h2 id="ways-h">Two ways to <em>work with Sokol.</em></h2></div>
    <ul class="impl-two">
      <li><span class="impl-tag">Done for you</span><h3>The creative subscription</h3><p>Send us your winners and we make the new versions, photos and video. $1,495 a month, each request delivered within 24 hours.</p><a class="ind-link" href="/pricing">See pricing</a></li>
      <li class="impl-hi"><span class="impl-tag">Built for you</span><h3>Implementation</h3><p>We build the system inside your business, train your team and hand it over. Scoped and quoted on a call.</p><a class="ind-link" href="{CALL}">Book an implementation call</a></li>
    </ul>
  </div>
</section>

<section class="ind-pains" id="build" aria-labelledby="build-h">
  <div class="wrap">
    <div class="center"><span class="ribbon">What we build</span><h2 id="build-h">Everything your team needs <em>to make it in-house.</em></h2></div>
    <ul class="ind-cards">{cards}</ul>
  </div>
</section>

<section class="ind-rules" aria-labelledby="proof-h">
  <div class="wrap">
    <div class="ind-rules-box">
      <h2 id="proof-h">We run Sokol on it</h2>
      <p>This is the system Sokol itself runs on: the brand profiles, trained characters, request pipeline and organized delivery behind our 24-hour subscription. Implementation means setting the same kind of system up inside your business, around your brand and your tools.</p>
    </div>
  </div>
</section>

<section class="ind-how" id="how" aria-labelledby="how-h">
  <div class="wrap">
    <div class="center"><span class="ribbon">How it works</span><h2 id="how-h">From one call <em>to your own studio.</em></h2></div>
    <ol class="ind-steps impl-steps">{steps}</ol>
  </div>
</section>

<section class="impl-who" aria-labelledby="who-h">
  <div class="wrap">
    <div class="center"><h2 id="who-h" class="ind-more-h">Who it’s for</h2></div>
    <ul class="ind-makes">{who}</ul>
  </div>
</section>

<section class="ind-faq" id="faq" aria-labelledby="faq-h">
  <div class="wrap">
    <div class="center"><h2 id="faq-h">Implementation <em>questions.</em></h2></div>
    <div class="faq mt40">{faq}</div>
  </div>
</section>

<section class="ind-plan" aria-labelledby="plan-h">
  <div class="wrap">
    <div class="ind-plan-box">
      <div>
        <h2 id="plan-h">See if it fits <em>your business.</em></h2>
        <p>A free 30-minute call. Bring your website and a few examples of your current ads or posts.</p>
      </div>
      <div class="ind-plan-cta"><a class="btn btn-main" href="{CALL}">Book an implementation call</a><a class="ind-link" href="/pricing">Rather we make it for you? See the subscription</a></div>
    </div>
  </div>
</section>
</main>
""" + blog.FOOT


if __name__ == "__main__":
    out = page()
    open("implementation.html", "w", encoding="utf-8").write(out)
    print("implementation.html", len(TITLE), "title chars", len(DESC), "desc chars")
