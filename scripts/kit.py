"""Build kit.html (the AI Creative System Kit sales page).

Run from the repo root:  python3 scripts/kit.py
Shares the head, nav and footer with the other generated pages (scripts/blog.py).
KIT_BUY must be the live Stripe payment link before this page is deployed.
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import blog
from blog import SITE, esc

KIT_BUY = "https://buy.stripe.com/9B6eVd2GLcHG3dP0oi5Ne02"   # replace with the $149 Stripe payment link
PRICE = "$149"
PATH = "/kit"
TITLE = "AI Creative System Kit for Business Owners — Sokol Systems"
DESC = ("Your own AI ad studio, set up by Claude. Type “set me up” to build a request queue, "
        "brand profile and 15 skills with Higgsfield. $149 once, 6 months of updates.")

STEPS = [
    ("Get the kit",
     "Pay once. You get the kit folder, the Claude skill to install and your private training guide, straight away."),
    ("Connect your tools",
     "Install one skill in Claude, then connect Google Drive, Gmail, Airtable and Higgsfield. The guide shows every click."),
    ("Type “set me up”",
     "Claude asks about your business, then builds your system: folders, Airtable base, brand profile and email alerts. It takes 20 to 40 minutes."),
]

INCLUDED = [
    ("The “set me up” folder",
     "Step-by-step instructions Claude follows to build the whole system inside your own Google Drive and Airtable."),
    ("15 ready-made skills",
     "Type one line, like “find my winners” or “make the next request”, and Claude runs the whole task for you."),
    ("Your creative system in Airtable",
     "A request queue, a winners tracker, deliveries and assets, linked together, with email alerts when work is ready to review."),
    ("Tested Higgsfield recipes",
     "Prompts for product shots, lifestyle scenes, gift sets, hands and UGC-style images, with the settings and the rules that keep your label right."),
    ("Templates that do the thinking",
     "Brand profile, briefs for every format, a winner breakdown and a 15-point quality check before anything goes live."),
    ("Training and 6 months of updates",
     "A 16-step guide with a progress bar and a fix for the usual snags at every step. When AI tools change, type “run the update” and Claude installs what’s new without touching your work."),
]

COMMANDS = [
    ("set me up", "Builds your whole system"),
    ("build my brand profile", "Researches your site and ads, writes your brand profile"),
    ("find my winners", "Ranks your ads by real results and logs the winners"),
    ("break down this ad", "Hook, angle, format and offer: why a winner works"),
    ("brief 5 variations of this", "Turns a winner into a brief in your queue"),
    ("make the next request", "Writes the prompts and makes the creative in Higgsfield"),
    ("write 5 hooks for this", "Hooks and short scripts for video ads"),
    ("check this delivery", "Runs the 15-point quality check"),
    ("make all sizes", "4:5, 9:16 and 1:1 versions inside safe zones"),
    ("write ad copy for this", "Primary text and headlines to match"),
    ("is this allowed?", "Flags fake-testimonial, claims and platform-policy risks"),
    ("what’s wearing out?", "Spots ads with creative fatigue"),
    ("weekly report", "Winners, fatigue and what to make next"),
    ("monthly check-up", "Tests your connections, automations and tools"),
    ("run the update", "Installs new kit versions"),
]

NEEDS = [
    ("A paid Claude plan", "Claude runs the setup and every skill. Use the desktop app and the most capable model on your plan."),
    ("Higgsfield", "Makes the images and video. Paid plans use credits: in our tests a draft image cost 0.25 credits and a finished one 2.75."),
    ("Airtable", "Your request queue and trackers. The free plan is enough to start."),
    ("Google Drive and Gmail", "Your brand files, deliveries and email alerts."),
    ("Meta Ads Manager", "To find your winning ads. Optional if you’re not running ads yet."),
    ("Time", "About two hours to set up, then 6 to 12 hours a week to run it well."),
]

FOR = ["Business owners and in-house marketers running Meta or TikTok ads",
       "Brands that need more creative than their budget allows",
       "Teams comfortable connecting a few online tools",
       "Anyone who wants to own the system, not rent it"]
NOT_FOR = ["You want it done for you, with no time spent each week",
           "You don’t use Claude and don’t want to",
           "You need guaranteed ad results (no one can honestly promise that)"]

FAQ = [
    ("Do I need technical skills?",
     "No coding. If you can connect an app to Claude and follow a checklist, you can set this up. The training guide shows every step, and Claude does the building."),
    ("Does it work with ChatGPT?",
     "No. The kit is built for Claude, because Claude can install skills and work directly in your Google Drive and Airtable. ChatGPT can’t run the setup the same way."),
    ("What does it cost to run each month?",
     "The kit is a one-time $149. The tools have their own plans: a paid Claude plan, Higgsfield credits for images and video, and Airtable (free to start). Check each tool’s pricing page, since prices change."),
    ("What happens after 6 months?",
     "Your kit keeps working. New updates continue with the optional Kit Updates membership, $29 a month or $279 a year. You can cancel the membership any time."),
    ("Can I get a refund?",
     "No. You get instant access to the full kit, so all sales are final. At checkout you confirm you want access straight away, which ends any right to cancel for digital content."),
    ("Can I share it with another business?",
     "No. One purchase covers one business and the people who work for it. Each copy carries a buyer ID."),
    ("Is this the system Sokol uses?",
     "It’s built on the same approach and tools behind the Sokol subscription, adapted so a business can run it for its own brand."),
    ("Will my ads perform better?",
     "We can’t promise that, and no one honestly can. The kit gives you a repeatable way to make new versions of what’s already working and test them."),
    ("What if I get stuck?",
     "Every step of the training guide has a “Stuck?” box with the usual fixes. You can also email marinko@sokolsystems.io."),
    ("Are the example images real products?",
     "No. They were made with the kit’s recipes for Lumen & Loam, a made-up demo brand. All of them are AI-generated."),
]

SHOTS = [
    ("ll-window", "Lit candle on a sunny windowsill", "Lifestyle scene"),
    ("ll-studio", "Candle on a cream studio backdrop", "Studio product shot"),
    ("ll-hands", "Hands lighting the candle with a match", "Hands with the product"),
    ("ll-unboxing", "Woman unboxing the candle in her kitchen", "UGC-style still"),
    ("ll-bluehour", "Room spray and candle at dusk", "Second scent, same look"),
    ("ll-giftset", "Gift box with three candles", "Gift set"),
]


def ld():
    graph = [
        {"@type": "Product", "@id": SITE + PATH + "#product", "name": "AI Creative System Kit",
         "description": DESC, "brand": {"@id": SITE + "/#org"}, "url": SITE + PATH,
         "offers": {"@type": "Offer", "price": "149", "priceCurrency": "USD", "url": SITE + PATH,
                    "availability": "https://schema.org/InStock"}},
        {"@type": "WebPage", "@id": SITE + PATH + "#webpage", "url": SITE + PATH, "name": "AI Creative System Kit",
         "isPartOf": {"@id": SITE + "/#website"}, "about": {"@id": SITE + PATH + "#product"}},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": "Kit", "item": SITE + PATH}]},
        {"@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in FAQ]},
    ]
    return '<script type="application/ld+json">' + json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False) + "</script>\n"


def page():
    nav = blog.NAV.replace(' aria-current="page"', "")
    steps = "".join(f"<li><h3>{esc(h)}</h3><p>{esc(p)}</p></li>" for h, p in STEPS)
    inc = "".join(f"<li><h3>{esc(h)}</h3><p>{esc(p)}</p></li>" for h, p in INCLUDED)
    cmds = "".join(f"<li><code>{esc(c)}</code><span>{esc(d)}</span></li>" for c, d in COMMANDS)
    needs = "".join(f"<tr><th scope=\"row\">{esc(n)}</th><td>{esc(w)}</td></tr>" for n, w in NEEDS)
    yes = "".join(f"<li>{esc(w)}</li>" for w in FOR)
    no = "".join(f"<li>{esc(w)}</li>" for w in NOT_FOR)
    faq = "".join(f"<details><summary>{esc(q)}</summary><p>{esc(a)}</p></details>" for q, a in FAQ)
    shots = "".join(
        f'<figure><img src="/media/kit/{f}-560.webp" srcset="/media/kit/{f}-560.webp 560w, /media/kit/{f}.webp 1120w" sizes="(max-width:520px) 46vw, (max-width:900px) 45vw, 360px" alt="{esc(alt)} (AI-generated demo)" loading="lazy" width="560" height="700"><figcaption>{esc(cap)}</figcaption></figure>'
        for f, alt, cap in SHOTS)
    buy = f'<a class="btn btn-main" href="{KIT_BUY}">Get the kit — {PRICE}</a>'
    return blog.head(TITLE, DESC, PATH, extra=ld()) + '</head>\n<body class="page ind-page impl-page kit-page">\n' + nav + f"""<main id="main">
<section class="ind-top center">
  <div class="wrap">
    <nav class="crumbs crumbs-c" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span>Kit</span></nav>
    <span class="ribbon">The AI Creative System Kit</span>
    <h1 class="pr-h1">Your own AI ad studio. <em>Set up by Claude.</em></h1>
    <p class="lede mt">Connect Claude to your tools, type “set me up”, and it builds a complete creative system inside your business: a request queue, your brand profile, a winners tracker and 15 ready-made skills for turning your best ads into new ones.</p>
    <div class="ind-cta">{buy}<a class="ind-link" href="#included">See what’s included</a></div>
    <p class="kit-fine">One-time payment · 6 months of updates included · All sales final</p>
  </div>
</section>

<section class="kit-shots-sec" aria-labelledby="shots-h">
  <div class="wrap">
    <div class="center"><h2 id="shots-h">Made with the kit’s <em>recipes.</em></h2>
    <p class="lede mt">Every image below came from the kit’s tested Higgsfield prompts, for a made-up demo brand. The same brand look in every shot.</p></div>
    <div class="kit-shots">{shots}</div>
    <p class="kit-fine kit-c">Lumen &amp; Loam is a fictional brand. All images are AI-generated.</p>
  </div>
</section>

<section class="ind-how" id="how" aria-labelledby="how-h">
  <div class="wrap">
    <div class="center"><span class="ribbon">How it works</span><h2 id="how-h">Three steps <em>to your own studio.</em></h2></div>
    <ol class="ind-steps">{steps}</ol>
  </div>
</section>

<section class="ind-pains" id="included" aria-labelledby="inc-h">
  <div class="wrap">
    <div class="center"><span class="ribbon">What’s included</span><h2 id="inc-h">Everything you need <em>to make it in-house.</em></h2></div>
    <ul class="ind-cards">{inc}</ul>
  </div>
</section>

<section class="kit-cmds-sec" aria-labelledby="cmd-h">
  <div class="wrap">
    <div class="center"><h2 id="cmd-h">15 skills. <em>One line each.</em></h2>
    <p class="lede mt">Type the words in Claude and it runs the whole task, asking before it creates, sends or spends anything.</p></div>
    <ul class="kit-cmds">{cmds}</ul>
  </div>
</section>

<section class="kit-needs-sec" aria-labelledby="needs-h">
  <div class="wrap">
    <div class="center"><h2 id="needs-h">What you’ll need, <em>honestly.</em></h2>
    <p class="lede mt">The kit is $149 once. The tools it runs on have their own plans, and running it well takes real time each week.</p></div>
    <div class="cmp-wrap"><table class="cmp kit-needs"><caption class="sr">What you need to run the kit</caption><tbody>{needs}</tbody></table></div>
  </div>
</section>

<section class="impl-who" aria-labelledby="who-h">
  <div class="wrap">
    <div class="kit-fit">
      <div><h2 id="who-h" class="ind-more-h">It’s for you if</h2><ul class="ind-makes">{yes}</ul></div>
      <div><h2 class="ind-more-h">It’s not for you if</h2><ul class="ind-makes kit-no">{no}</ul></div>
    </div>
  </div>
</section>

<section class="impl-ways" aria-labelledby="ways-h">
  <div class="wrap">
    <div class="center"><h2 id="ways-h">Three ways <em>to get it done.</em></h2></div>
    <ul class="impl-two kit-three">
      <li class="impl-hi"><span class="impl-tag">Do it yourself</span><h3>The kit</h3><p>Set up the system yourself with Claude and run it in-house. {PRICE} once, with 6 months of updates.</p><a class="ind-link" href="{KIT_BUY}">Get the kit</a></li>
      <li><span class="impl-tag">Built for you</span><h3>Implementation</h3><p>We build a custom version inside your business, train your team and hand it over. Quoted on a call.</p><a class="ind-link" href="/implementation">See implementation</a></li>
      <li><span class="impl-tag">Done for you</span><h3>The subscription</h3><p>Send us your winners and we make the new versions for you. $1,495 a month, each request within 24 hours.</p><a class="ind-link" href="/pricing">See the subscription</a></li>
    </ul>
  </div>
</section>

<section class="ind-faq" id="faq" aria-labelledby="faq-h">
  <div class="wrap">
    <div class="center"><h2 id="faq-h">Kit <em>questions.</em></h2></div>
    <div class="faq mt40">{faq}</div>
  </div>
</section>

<section class="ind-plan" aria-labelledby="plan-h">
  <div class="wrap">
    <div class="ind-plan-box">
      <div>
        <h2 id="plan-h">Build your own <em>AI ad studio.</em></h2>
        <p>{PRICE} once. Instant access, 6 months of updates, and a private training guide. All sales final. By buying you agree to the <a href="/terms#kit">kit terms</a>.</p>
      </div>
      <div class="ind-plan-cta">{buy}<a class="ind-link" href="/pricing">Rather we make it for you? See the subscription</a></div>
    </div>
  </div>
</section>
</main>
""" + blog.FOOT


def thanks_page():
    """kit-thanks.html: where Stripe sends buyers after paying (?session_id=...). Body attributes let
    main.js record one Purchase for Meta, only for visitors who chose "Allow all"."""
    nav = blog.NAV.replace(' aria-current="page"', "")
    head = blog.head("You’re in — AI Creative System Kit", "Your AI Creative System Kit is on its way.", "/kit-thanks").replace(
        '<meta name="robots" content="index,follow,max-image-preview:large">', '<meta name="robots" content="noindex,nofollow">')
    return head + '</head>\n<body class="page" data-conversion="Purchase" data-value="149" data-item="AI Creative System Kit">\n' + nav + """<main id="main" class="doc">
<h1>You’re <em>in.</em></h1>
<p>Thanks for buying the AI Creative System Kit. Your welcome email is on its way to the email you used at checkout.</p>
<ol class="steps">
<li>Open the welcome email. It has your kit folder, the Claude skill, your training guide and your Buyer ID.</li>
<li>Open the kit folder while signed in to the Google account it’s shared with.</li>
<li>Follow the training guide from step 1. Setup takes about two hours.</li>
</ol>
<p>If your checkout email isn’t a Google account, we’ll email you to ask which Google account to share the folder with.</p>
<p>No email within 15 minutes? Check spam, then write to <a href="mailto:marinko@sokolsystems.io">marinko@sokolsystems.io</a> from the email you used at checkout.</p>
</main>
""" + blog.FOOT


if __name__ == "__main__":
    out = page()
    open("kit.html", "w", encoding="utf-8").write(out)
    print("kit.html", len(TITLE), "title chars", len(DESC), "desc chars")
    open("kit-thanks.html", "w", encoding="utf-8").write(thanks_page())
    print("kit-thanks.html written")
