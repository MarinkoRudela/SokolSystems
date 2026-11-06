"""Build the kit training guide (private, unlisted page for kit buyers).

Run from the repo root:  python3 scripts/kit_guide.py
Writes kit-guide-br8xu7s9yq.html. The address is only in the welcome email and the kit files,
it is noindex, and it isn't in the sitemap or llms.txt. Progress is kept in the buyer's own
browser (kit-guide.js), so there is nothing to log in to.

To add a screenshot or video to a step later: put the file in /media/kit-guide/ and add
"shot": ("file.webp", "alt text") to that step. Videos: "video": "https://..." (a link).
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
import blog
from blog import esc

SLUG = "kit-guide-br8xu7s9yq"
PATH = "/" + SLUG
TITLE = "Kit training guide — AI Creative System Kit"
DESC = "Step-by-step setup guide for the AI Creative System Kit."
HIGGSFIELD = "https://higgsfield.ai?fpr=marinko-15966f"
KIT_FOLDER = "https://drive.google.com/drive/folders/18aJmaH44JFuLWRjGrPyxoV9Zbdno21KY"
SKILL_ZIP = "https://drive.google.com/file/d/1LFxXOlBw4JifPqJaf9xCn1i97LbUsGSl/view"

# (part title, [steps]). Each step: id, title, minutes, do (list of HTML strings), see (HTML), stuck (list of (problem, fix)).
PARTS = [
 ("Before you start", [
  dict(id="accounts", title="Get your accounts ready", minutes=15,
   do=[
    "A <strong>paid Claude plan</strong> and the <strong>Claude desktop app</strong> (download it from <a href=\"https://claude.com/download\" rel=\"noopener\">claude.com/download</a> and sign in).",
    "A <strong>Google account</strong> with Drive and Gmail. A normal Gmail account works; Google Workspace is fine too.",
    "An <strong>Airtable</strong> account. The free plan is enough to start.",
    f"A paid <strong>Higgsfield</strong> plan, for making images and video: <a href=\"{HIGGSFIELD}\" rel=\"sponsored noopener\">higgsfield.ai</a>. <span class=\"g-aff\">Affiliate link: Sokol earns a commission if you buy a plan, at no extra cost to you.</span>",
    "<strong>Meta Ads Manager</strong> access, if you run ads. Optional: Claude can also start from your product and best posts.",
   ],
   see="Four accounts you can sign in to. Write down which Google account you’ll use: the kit folder is shared with it.",
   stuck=[
    ("Which Claude plan do I need?", "Any paid plan works for setup. If you make lots of creative each week, a higher plan gives you more room before you hit usage limits."),
    ("Do I have to use Higgsfield?", "For “make the next request”, yes: the recipes are written and tested for it. Everything else (briefs, hooks, ad copy, reports) works without it."),
   ]),
  dict(id="capabilities", title="Turn on file creation in Claude", minutes=2,
   do=[
    "In Claude, open <strong>Settings &gt; Capabilities</strong>.",
    "Turn on <strong>Create and edit files</strong> (on some accounts it’s called <strong>Code execution and file creation</strong>).",
   ],
   see="The switch is on. Skills only work with it on.",
   stuck=[
    ("I can’t find the setting.", "You’re probably on a Team or Enterprise plan. Your admin turns it on in <strong>Organization settings &gt; Plugins &amp; skills</strong>, on the <strong>Policy</strong> tab, together with <strong>Skills</strong>."),
   ]),
  dict(id="kit-folder", title="Open your kit folder", minutes=2,
   do=[
    f"Open the <a href=\"{KIT_FOLDER}\" rel=\"noopener\">kit folder</a> (also in your welcome email) while signed in to the Google account it was shared with.",
    "Have a look, but don’t copy, move or rename anything. Claude copies what you need into your own Drive during setup.",
   ],
   see="A folder called <strong>AI Creative System Kit</strong> with <code>setup</code>, <code>commands</code>, <code>templates</code>, <code>prompts</code>, <code>updates</code>, <code>install</code> and <code>START-HERE</code>.",
   stuck=[
    ("Google says “You need access”.", "You’re signed in to a different Google account. Switch accounts (your profile picture, top right), or reply to your welcome email with the account you want to use and we’ll move the access."),
   ]),
 ]),
 ("Install and connect", [
  dict(id="install-skill", title="Install the skill", minutes=5,
   do=[
    f"Download <a href=\"{SKILL_ZIP}\" rel=\"noopener\">creative-system.zip</a> (it’s also in the kit folder’s <code>install</code> folder). Don’t unzip it.",
    "In Claude, go to <strong>Customize &gt; Skills</strong>.",
    "Click <strong>+</strong>, then <strong>+ Create skill</strong>, then <strong>Upload a skill</strong>, and choose the zip.",
    "Make sure the switch next to <strong>creative-system</strong> is on.",
   ],
   see="<strong>creative-system</strong> in your skills list, switched on.",
   stuck=[
    ("The upload fails.", "Check the file is still a .zip. Safari on a Mac can unzip downloads by itself: download it again with Chrome, or right-click the unzipped folder and choose Compress. Also check file creation is on (step 2)."),
    ("I don’t see Customize.", "Update the Claude desktop app to the latest version, or try claude.ai in your browser."),
   ]),
  dict(id="connect-google", title="Connect Google Drive and Gmail", minutes=5,
   do=[
    "In a new chat, click <strong>+</strong> (bottom left), hover over <strong>Connectors</strong> and choose <strong>Manage connectors</strong>, then <strong>Browse connectors</strong>.",
    "Find <strong>Google Drive</strong>, click <strong>Connect</strong> and sign in with the <strong>same Google account</strong> your kit folder is shared with. Allow access.",
    "Do the same for <strong>Gmail</strong>.",
   ],
   see="Google Drive and Gmail listed as connected.",
   stuck=[
    ("I connected the wrong Google account.", "Disconnect it in the same connectors list and connect again with the right account."),
   ]),
  dict(id="connect-airtable", title="Connect Airtable", minutes=3,
   do=[
    "In the same connectors list, find <strong>Airtable</strong> and click <strong>Connect</strong>.",
    "When Airtable asks what Claude can use, give it access to the workspace where you want your system, including future bases. Claude creates a new base there during setup.",
   ],
   see="Airtable listed as connected.",
   stuck=[
    ("Claude says it can’t create a base.", "Reconnect Airtable and include the whole workspace (not just existing bases)."),
   ]),
  dict(id="connect-higgsfield", title="Connect Higgsfield", minutes=3,
   do=[
    "In Claude, open <strong>Settings &gt; Connectors</strong> and click <strong>Add custom connector</strong>.",
    "Paste <code>https://mcp.higgsfield.ai/mcp</code> and click <strong>Connect</strong>.",
    "Sign in to Higgsfield and allow access.",
   ],
   see="Higgsfield listed in your connectors.",
   stuck=[
    ("It connects but nothing generates.", "Higgsfield needs a paid plan with credits. Check your balance at higgsfield.ai."),
   ]),
  dict(id="new-chat", title="Start the right chat", minutes=1,
   do=[
    "Open a <strong>new chat</strong> in the Claude desktop app.",
    "In the model menu, pick the most capable model on your plan (currently <strong>Claude Opus 5.5</strong>).",
    "Click <strong>+ &gt; Connectors</strong> and check Google Drive, Gmail, Airtable and Higgsfield are switched on for this chat.",
   ],
   see="A fresh chat with the best model and all four connectors on.",
   stuck=[
    ("A connector is missing from the list.", "It isn’t connected yet. Go back to steps 5 to 7."),
    ("I can’t pick Claude Opus.", "Some plans only offer it with limits. Use the most capable model you have; setup takes longer with a smaller one but works."),
   ]),
 ]),
 ("Set me up", [
  dict(id="set-me-up", title="Type “set me up”", minutes=40,
   do=[
    "Type <code>set me up</code> and send it.",
    "Claude checks your connections, then asks for your <strong>Buyer ID</strong> (in your welcome email), your business name, website, what you sell, where you advertise and the email for notifications.",
    "It builds your folders in Drive, your Airtable base, your brand profile and your email alerts, telling you which stage it’s on. Click <strong>Allow</strong> when it asks to use a tool.",
    "Keep the chat open until it says it’s finished. It takes 20 to 40 minutes.",
   ],
   see="A <strong>Creative System</strong> folder in your Drive, a <strong>Creative System</strong> base in Airtable, a <strong>Brand profile</strong> doc, and a short finish list from Claude.",
   stuck=[
    ("Claude can’t find the kit folder.", "Paste the kit folder link from your welcome email into the chat."),
    ("Claude stopped halfway.", "Type <code>continue</code>. If the chat ran out of room, start a new chat and type <code>monthly check-up</code>: it checks what was built and tells you what’s missing."),
    ("A connector isn’t working.", "Go back to steps 5 to 7, reconnect it, then type <code>continue</code>."),
   ]),
  dict(id="brand-profile", title="Check your brand profile", minutes=15,
   do=[
    "Open <strong>Creative System &gt; Brand &gt; Brand profile</strong> in your Drive.",
    "Fix anything that’s wrong, especially lines marked <strong>check this</strong>: products, prices, tone, and claims you must never make.",
   ],
   see="A brand profile you’d be happy to hand to a designer. Claude reads it before every piece of work.",
   stuck=[
    ("It got something badly wrong.", "Tell Claude what’s wrong in a chat and type <code>build my brand profile</code> to redo it."),
   ]),
  dict(id="finish-list", title="Finish the last manual steps", minutes=15,
   do=[
    "In Airtable, open the <strong>Creative System</strong> base, go to <strong>Automations</strong> and switch on the three automations. Claude can’t switch them on for you.",
    "Add your logo and 5 to 10 product photos to <strong>Creative System &gt; Brand</strong> in Drive.",
    "In the Airtable <strong>Assets</strong> table, tick <strong>Rights confirmed</strong> only for files you own or have permission to use in ads.",
   ],
   see="Everything on Claude’s finish list ticked off.",
   stuck=[
    ("There are no automations in Airtable.", "Claude gives you click-by-click steps in its finish list instead. Follow those, or ask it: “show me how to create the Airtable automations”."),
   ]),
 ]),
 ("Your first ad", [
  dict(id="winners", title="Find your winners", minutes=20,
   do=[
    "Type <code>find my winners</code>.",
    "If Claude can’t read your ads directly, it asks for an export from Ads Manager (or screenshots) with: ad name, amount spent, results, cost per result, CTR and frequency.",
    "Tell it what a result is for you (a purchase, a lead, a booking).",
   ],
   see="Your ads sorted into winners, promising, below average and not enough data, saved in the <strong>Winners</strong> table.",
   stuck=[
    ("I don’t run ads yet.", "Skip this. Claude can start from your product and your best organic posts."),
   ]),
  dict(id="brief", title="Break it down and brief it", minutes=20,
   do=[
    "Type <code>break down this ad</code> and pick your best winner. Claude explains the hook, angle, format and offer that made it work.",
    "Type <code>brief 5 variations of this</code>. Each variation changes one thing, so your results tell you something.",
   ],
   see="A new request in your Airtable <strong>Requests</strong> table with a clear brief.",
   stuck=[
    ("Claude can’t see the ad.", "Upload a screenshot or the video file into the chat, or paste the ad’s text and its results."),
   ]),
  dict(id="make", title="Make the next request", minutes=30,
   do=[
    "Type <code>make the next request</code>.",
    "Claude shows its plan and the estimated Higgsfield credits. <strong>Nothing is generated until you say yes.</strong>",
    "It makes quick drafts first. Pick the best direction, then it makes the finished versions at high quality.",
   ],
   see="New files in <strong>Creative System &gt; Deliveries</strong> and the request set to <strong>Ready for review</strong>.",
   stuck=[
    ("The label or logo comes out wrong.", "Make sure a clear product photo is in Brand with Rights confirmed. The recipes attach it and spell out your label text; type <code>check this delivery</code> to catch problems."),
    ("I’m running out of credits.", "Ask Claude to make fewer drafts, or top up in Higgsfield."),
   ]),
  dict(id="review", title="Check, size and approve", minutes=20,
   do=[
    "Type <code>check this delivery</code> to run the 15-point quality check.",
    "Type <code>make all sizes</code> for 4:5, 9:16 and 1:1 versions.",
    "Type <code>is this allowed?</code> before anything goes live.",
    "Approve it yourself in Airtable. Claude never ticks Approved.",
   ],
   see="An approved ad, in every size, ready to launch.",
   stuck=[
    ("The quality check fails.", "Type <code>make the next request</code> again: Claude regenerates what failed and asks before spending more credits."),
    ("A size crops the product badly.", "Ask Claude to remake that size with the product smaller and centered, inside the safe zone."),
   ]),
 ]),
 ("Every week", [
  dict(id="weekly", title="Run your weekly rhythm", minutes=10,
   do=[
    "<strong>Monday:</strong> <code>weekly report</code> (Claude builds a dashboard of your week and saves a copy in <strong>Creative System &gt; Reports</strong>) and <code>what’s wearing out?</code>",
    "<strong>Tuesday:</strong> <code>break down this ad</code>, <code>brief 5 variations of this</code>",
    "<strong>Wednesday:</strong> <code>make the next request</code>, <code>write 5 hooks for this</code>",
    "<strong>Thursday:</strong> <code>check this delivery</code>, <code>make all sizes</code>, <code>is this allowed?</code>",
    "<strong>Friday:</strong> launch, and <code>write ad copy for this</code>",
    "<strong>Once a month:</strong> <code>monthly check-up</code>",
   ],
   see="About 6 to 12 hours a week. The full plan is in <strong>Creative System &gt; System files &gt; templates &gt; weekly-rhythm</strong>.",
   stuck=[
    ("No winners this week?", "Make new angles on your best product instead of more versions of a weak ad."),
   ]),
 ]),
]

UPDATES = """<section class="g-updates" id="updates" aria-labelledby="upd-h">
  <h2 id="upd-h">Keeping your kit current</h2>
  <p>When AI tools change, we update the kit. Type <code>run the update</code> in Claude: it shows what’s new and installs it without touching your own work. Your included updates last 3 months from purchase (the date is in your welcome email).</p>
  <p>After that, the kit keeps working exactly as it is. If you want new updates, the <strong>Kit Updates membership</strong> is $29 a month or $279 a year, cancel anytime. We’ll email you before your included months end with the link.</p>
</section>"""


def step_html(n, s):
    do = "".join(f"<li>{d}</li>" for d in s["do"])
    stuck = ""
    if s["stuck"]:
        items = "".join(f"<dt>{p}</dt><dd>{f}</dd>" for p, f in s["stuck"])
        stuck = f'<details class="g-stuck"><summary>Stuck?</summary><dl>{items}</dl></details>'
    shot = ""
    if s.get("shot"):
        f, alt = s["shot"]
        shot = f'<figure class="g-shot"><img src="/media/kit-guide/{f}" alt="{esc(alt)}" loading="lazy"></figure>'
    video = f'<p class="g-video"><a href="{esc(s["video"])}" rel="noopener">Watch this step (video)</a></p>' if s.get("video") else ""
    return f"""<article class="g-step" id="{s['id']}" data-step="{s['id']}">
  <header><span class="g-num">{n}</span><div><h3>{esc(s['title'])}</h3><p class="g-time">About {s['minutes']} min</p></div></header>
  <ol class="g-do">{do}</ol>{shot}{video}
  <p class="g-see"><strong>You should see:</strong> {s['see']}</p>
  {stuck}
  <button type="button" class="g-done" data-done="{s['id']}" aria-pressed="false"><span class="g-box" aria-hidden="true"></span><span class="g-lbl">Mark complete</span></button>
</article>"""


def page():
    n = 0
    toc, body = [], []
    for pi, (part, steps) in enumerate(PARTS, 1):
        items = []
        arts = []
        for s in steps:
            n += 1
            items.append(f'<li><a href="#{s["id"]}" data-toc="{s["id"]}"><span class="g-dot" aria-hidden="true"></span>{n}. {esc(s["title"])}</a></li>')
            arts.append(step_html(n, s))
        toc.append(f'<li><span class="g-part">Part {pi} · {esc(part)}</span><ol>{"".join(items)}</ol></li>')
        body.append(f'<section class="g-sec" aria-labelledby="p{pi}"><h2 id="p{pi}"><span>Part {pi}</span> {esc(part)}</h2>{"".join(arts)}</section>')
    total = n
    head = blog.head(TITLE, DESC, PATH).replace(
        '<meta name="robots" content="index,follow,max-image-preview:large">',
        '<meta name="robots" content="noindex,nofollow,noarchive">')
    return head + f"""<script src="/kit-guide.js" defer></script>
</head>
<body class="page kit-guide">
<a class="skip" href="#main">Skip to content</a>
<header class="g-top">
  <div class="wrap g-top-in">
    <a class="mark" href="/" aria-label="Sokol Systems home"><img src="/media/46eded87-b4c3-40a7-aac9-ff9a2842df7d.webp" alt="" width="34" height="34">Sokol Systems</a>
    <div class="g-prog" role="group" aria-label="Your progress">
      <div class="g-bar"><div class="g-fill" id="g-fill"></div></div>
      <p class="g-count" id="g-count" aria-live="polite">0 of {total} steps done</p>
    </div>
  </div>
</header>
<main id="main">
<section class="g-hero">
  <div class="wrap">
    <span class="ribbon">Kit training guide</span>
    <h1>Set up your <em>AI Creative System.</em></h1>
    <p class="lede">{total} steps: about two hours to set up, then about 90 minutes to make your first ad. Tick each one off as you go: your progress is saved in this browser, so you can stop and come back.</p>
    <p class="g-actions"><a class="btn btn-main" id="g-continue" href="#accounts">Start at step 1</a></p>
    <p class="g-private">This guide is for kit buyers only. Please don’t share the link.</p>
  </div>
</section>
<div class="wrap g-layout">
  <nav class="g-toc" aria-label="Steps"><ol>{"".join(toc)}</ol>
    <p><a href="#updates">Keeping your kit current</a></p>
    <p><button type="button" class="g-reset" id="g-reset">Reset my progress</button></p>
  </nav>
  <div class="g-main">
    {"".join(body)}
    <section class="g-finish" id="g-finish" hidden><h2>All done. <em>Nice work.</em></h2><p>Your system is set up and you’ve made your first ad. From here it’s the weekly rhythm: winners in, new versions out.</p></section>
    {UPDATES}
    <section class="g-help" aria-labelledby="help-h">
      <h2 id="help-h">Need a hand?</h2>
      <p>Email <a href="mailto:marinko@sokolsystems.io">marinko@sokolsystems.io</a> with your Buyer ID and the step you’re on.</p>
      <p>Rather have it built for you, or the creative made for you? See <a href="/implementation">implementation</a> or <a href="/pricing">the subscription</a>.</p>
    </section>
  </div>
</div>
</main>
<footer class="g-foot"><div class="wrap"><p>© 2026 Sokol Systems · <a href="/terms#kit">Kit terms</a> · <a href="/privacy">Privacy</a></p></div></footer>
</body>
</html>
"""


if __name__ == "__main__":
    open(SLUG + ".html", "w", encoding="utf-8").write(page())
    print(SLUG + ".html written")
