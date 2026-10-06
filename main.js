(function(){
  // ---- cookie consent + analytics (loads only after opt-in) ----
  var KEY='sokol-consent', banner=document.getElementById('consent');
  function loadAnalytics(){
    if(window.__vaLoaded) return; window.__vaLoaded=true;
    window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};
    var s=document.createElement('script'); s.defer=true; s.src='/_vercel/insights/script.js'; document.head.appendChild(s);
  }
  function choice(){ try{return localStorage.getItem(KEY)}catch(e){return null} }
  function save(v){ try{localStorage.setItem(KEY,v)}catch(e){} }
  if(banner){
    var c=choice();
    if(c==='granted') loadAnalytics(); else if(!c) banner.hidden=false;
    banner.querySelector('[data-consent="accept"]').addEventListener('click',function(){save('granted');banner.hidden=true;loadAnalytics();});
    banner.querySelector('[data-consent="decline"]').addEventListener('click',function(){save('denied');banner.hidden=true;});
  }
  var reopen=document.getElementById('cookie-settings');
  if(reopen&&banner) reopen.addEventListener('click',function(){banner.hidden=false;banner.querySelector('button').focus();});

  // ---- contact form: validation + spam protection ----
  var form=document.getElementById('contact-form'); if(!form) return;
  var started=form.querySelector('[name="started_at"]'); started.value=String(Date.now());
  var status=form.querySelector('.form-status');
  var rules={
    name:function(v){return v.trim().length>=2&&v.trim().length<=80?'':'Enter your name (2–80 characters).'},
    email:function(v){return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())&&v.length<=160?'':'Enter a valid email address, like name@company.com.'},
    website:function(v){if(!v.trim())return '';try{var u=new URL(/^https?:\/\//.test(v)?v:'https://'+v);return u.hostname.indexOf('.')>0?'':'Enter a valid website, like yourbrand.com.'}catch(e){return 'Enter a valid website, like yourbrand.com.'}},
    message:function(v){var t=v.trim();return t.length>=10&&t.length<=2000?'':'Tell us a little more (10–2,000 characters).'}
  };
  function check(el){
    var fn=rules[el.name]; if(!fn) return true;
    var msg=fn(el.value), box=el.closest('.field'), err=box.querySelector('.err');
    box.classList.toggle('invalid',!!msg); err.textContent=msg; el.setAttribute('aria-invalid',msg?'true':'false');
    return !msg;
  }
  Object.keys(rules).forEach(function(n){var el=form.elements[n];el.addEventListener('blur',function(){check(el)});el.addEventListener('input',function(){if(el.closest('.field').classList.contains('invalid'))check(el)});});
  form.addEventListener('submit',function(e){
    e.preventDefault(); status.className='form-status'; status.textContent='';
    var bad=null; Object.keys(rules).forEach(function(n){var el=form.elements[n]; if(!check(el)&&!bad) bad=el;});
    if(bad){bad.focus(); return;}
    var btn=form.querySelector('button[type="submit"]'); btn.disabled=true; btn.textContent='Sending…';
    var data={}; new FormData(form).forEach(function(v,k){data[k]=v});
    fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})
      .then(function(r){return r.json().catch(function(){return {}}).then(function(j){return {ok:r.ok,j:j}})})
      .then(function(res){
        if(res.ok){form.reset();started.value=String(Date.now());status.className='form-status ok';status.textContent='Message sent. We reply within one business day.';}
        else{status.className='form-status bad';status.textContent=(res.j&&res.j.error)||'Your message was not sent. Try again, or email marinko@sokolsystems.io.';}
      })
      .catch(function(){status.className='form-status bad';status.textContent='Your message was not sent. Check your connection and try again.';})
      .finally(function(){btn.disabled=false;btn.textContent='Send message';});
  });
})();

(function(){
  // hero typing demo (skipped when the visitor prefers reduced motion)
  var el=document.getElementById('typed'); if(!el) return;
  if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var lines=['Three static ads for our summer sale, in 4:5 and 9:16','A UGC-style video for our new serum launch','Product shots on marble, soft morning light','Five new hooks for our best-selling ad','A carousel explaining how our app works'];
  var i=0,j=lines[0].length,del=true;
  function tick(){
    var s=lines[i];
    if(del){ j--; el.textContent=s.slice(0,j); if(j<=0){del=false;i=(i+1)%lines.length;} setTimeout(tick,22); }
    else { j++; el.textContent=lines[i].slice(0,j); if(j>=lines[i].length){del=true; setTimeout(tick,2200);} else setTimeout(tick,45); }
  }
  setTimeout(tick,2600);
})();

(function(){
  // explainer video: autoplay only when visible and motion is OK; always pausable
  var v=document.getElementById('reel'), b=document.getElementById('reel-toggle'); if(!v||!b) return;
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var userPaused=reduce;
  function label(){ var p=v.paused; b.textContent=p?'Play':'Pause'; b.setAttribute('aria-pressed',p?'true':'false'); }
  function play(){ var pr=v.play(); if(pr&&pr.catch) pr.catch(function(){}); }
  b.addEventListener('click',function(){ if(v.paused){userPaused=false;play();} else {userPaused=true;v.pause();} });
  v.addEventListener('play',label); v.addEventListener('pause',label); label();
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ if(!userPaused) play(); } else v.pause(); }); },{threshold:.35}).observe(v);
  } else if(!reduce){ play(); }
})();

(function(){
  // ---- scroll & motion effects (homepage). Skipped entirely for prefers-reduced-motion. ----
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce||!('IntersectionObserver' in window)||!document.querySelector('.hero')) return;
  var root=document.documentElement, vh=window.innerHeight;

  // 1) Reveal on scroll. Anything already on screen at load stays put (no flash); the rest rises in.
  var groups=[
    ['#problem h2, #problem .lede, #how h2, #how .lede, #math h2, #math .lede, #pricing h2, #pricing .lede, #faq h2, #contact h2, #contact .lede, .final h2, .final .lede, .ribbon','rv'],
    ['.cards3 .cloud','rv rv-flip'],
    ['.row-text','rv rv-left'],
    ['.row .frame','rv rv-right'],
    ['.reel','rv rv-zoom'],
    ['.receipt','rv rv-print'],
    ['.stamp','rv rv-stamp'],
    ['.plan','rv rv-zoom'],
    ['#faq details','rv'],
    ['.contact-grid > *','rv']
  ];
  var seen=new Set(), targets=[];
  groups.forEach(function(g){
    var list=document.querySelectorAll(g[0]);
    Array.prototype.forEach.call(list,function(el,i){
      if(seen.has(el)) return; seen.add(el);
      if(el.getBoundingClientRect().top<vh*0.92) return;           // already visible: leave it alone
      g[1].split(' ').forEach(function(c){el.classList.add(c)});
      var sib=el.parentElement?Array.prototype.indexOf.call(el.parentElement.children,el):i;
      el.style.setProperty('--d',(Math.min(sib,5)*90)+'ms');        // stagger siblings
      targets.push(el);
    });
  });
  root.classList.add('js-motion');
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(!e.isIntersecting) return;
      e.target.classList.add('in'); io.unobserve(e.target);
      if(e.target.classList.contains('rv-print')||e.target.classList.contains('rv-stamp')) countUp(e.target);
    });
  },{threshold:.18,rootMargin:'0px 0px -6% 0px'});
  targets.forEach(function(el){io.observe(el)});
  // Safety net: anything scrolled past or jumped over (menu links, fast scrolls, clipped elements) is revealed.
  var pending=targets.slice();
  function sweep(){
    if(!pending.length) return;
    pending=pending.filter(function(el){
      if(el.mosaic){ if(!el.mosaic.isConnected) return false; if(el.el.getBoundingClientRect().top<vh*0.88){ el.mosaic.classList.add('go'); setTimeout(function(){el.mosaic.remove();},1700); return false; } return true; }
      if(el.classList.contains('in')) return false;
      if(el.getBoundingClientRect().top<vh*0.88){
        el.classList.add('in'); io.unobserve(el);
        if(el.classList.contains('rv-print')||el.classList.contains('rv-stamp')) countUp(el);
        return false;
      }
      return true;
    });
  }

  // 2) Count-up for the money figures on the receipts and the stamp.
  function countUp(scope){
    var bs=scope.matches('b')?[scope]:scope.querySelectorAll('.total b, b');
    Array.prototype.forEach.call(bs,function(b){
      var nodes=[];
      b.childNodes.forEach(function(n){ if(n.nodeType===3&&/\d/.test(n.nodeValue)) nodes.push({n:n,t:n.nodeValue}); });
      if(!nodes.length) return;
      var start=null, dur=1300;
      function fmt(v){ return Math.round(v).toLocaleString('en-US'); }
      function step(ts){
        if(!start) start=ts; var p=Math.min(1,(ts-start)/dur), e=1-Math.pow(1-p,3);
        nodes.forEach(function(o){ o.n.nodeValue=o.t.replace(/\d[\d,]*/g,function(m){ var f=+m.replace(/,/g,''); return fmt(f*e); }); });
        if(p<1) requestAnimationFrame(step); else nodes.forEach(function(o){o.n.nodeValue=o.t;});
      }
      requestAnimationFrame(step);
    });
  }

  // 3) Scroll-linked effects: progress bar, sticky nav state, hero parallax + falcon flight, footer parallax.
  var bar=document.createElement('div'); bar.className='scroll-bar'; bar.setAttribute('aria-hidden','true'); document.body.appendChild(bar);
  var nav=document.querySelector('.site-nav'), hero=document.querySelector('.hero'), falcon=document.querySelector('.hero-falcon'), scene=document.querySelector('.scene');
  var ticking=false;
  function frame(){
    ticking=false;
    sweep();
    var y=window.scrollY, max=document.documentElement.scrollHeight-vh;
    bar.style.transform='scaleX('+(max>0?Math.min(1,y/max):0)+')';
    if(nav) nav.classList.toggle('scrolled',y>24);
    if(hero&&y<vh*1.4){
      hero.style.setProperty('--hy',(y*0.35).toFixed(1)+'px');
      if(falcon){ falcon.style.translate=(y*0.45).toFixed(1)+'px '+(-y*0.55).toFixed(1)+'px'; falcon.style.rotate=(-y*0.012).toFixed(2)+'deg'; }
    }
    if(scene){
      var r=scene.getBoundingClientRect();
      if(r.top<vh&&r.bottom>0) scene.style.setProperty('--sy',((r.top-vh)*0.18).toFixed(1)+'px');
    }
  }
  window.addEventListener('scroll',function(){ if(!ticking){ticking=true;requestAnimationFrame(frame);} },{passive:true});
  window.addEventListener('resize',function(){ vh=window.innerHeight; },{passive:true});
  window.addEventListener('hashchange',function(){ setTimeout(frame,50); });
  frame();

  // 4) Tile effects.
  //   a) Mosaic: a grid of cream tiles over the app windows and the video that dissolves in random order.
  function mosaic(el,cols,rows){
    if(el.getBoundingClientRect().top<vh*0.92) return;
    if(getComputedStyle(el).position==='static') el.style.position='relative';
    var g=document.createElement('div'); g.className='mosaic'; g.setAttribute('aria-hidden','true');
    g.style.gridTemplateColumns='repeat('+cols+',1fr)'; g.style.gridTemplateRows='repeat('+rows+',1fr)';
    for(var k=0;k<cols*rows;k++){ var t=document.createElement('i'); t.style.setProperty('--t',Math.round(Math.random()*650)+'ms'); g.appendChild(t); }
    el.appendChild(g);
    var o=new IntersectionObserver(function(es){ if(es[0].isIntersecting){ o.disconnect(); setTimeout(function(){ g.classList.add('go'); setTimeout(function(){ g.remove(); },1700); },250); } },{threshold:.3});
    o.observe(el);
    pending.push({mosaic:g,el:el});
  }
  Array.prototype.forEach.call(document.querySelectorAll('.row .frame'),function(f){ mosaic(f,8,6); });
  var reelFrame=document.querySelector('.reel-frame'); if(reelFrame) mosaic(reelFrame,12,7);

  //   b) Platform chips drop in one by one the first time the ticker scrolls into view.
  var marquee=document.querySelector('.marquee');
  if(marquee&&marquee.getBoundingClientRect().top>vh*0.92){
    marquee.classList.add('chips-in');
    Array.prototype.forEach.call(marquee.querySelectorAll('.chip'),function(c,k){ c.style.setProperty('--i',k%10); });
    new IntersectionObserver(function(es,o){ if(es[0].isIntersecting){ marquee.classList.add('in'); o.disconnect(); } },{threshold:.4}).observe(marquee);
  }

  //   c) Pricing checklist tiles in, ticks draw on.
  Array.prototype.forEach.call(document.querySelectorAll('.plan li'),function(li,k){ li.style.setProperty('--i',k); });

  // 5) Disappearing: the hero and each section intro dissolve (fade + blur + drift) as they leave the top.
  var fades=[].slice.call(document.querySelectorAll('.hero .wrap, section .center > h2, section.center > .wrap > h2, section .center .ribbon, section.center > .wrap > .ribbon, section.center > .wrap > .lede, #how .center .lede'));
  function dissolve(){
    var top=90;
    fades.forEach(function(el){
      var r=el.getBoundingClientRect(); if(r.bottom<-50||r.top>vh*0.6) { if(el.__f){ el.style.opacity='';el.style.filter='';el.style.transform='';el.__f=false;} return; }
      var span=Math.max(140,r.height*0.9), o=Math.max(0,Math.min(1,(r.bottom-top)/span));
      if(o>=1){ if(el.__f){ el.style.opacity='';el.style.filter='';el.style.transform='';el.__f=false;} return; }
      if(el.classList.contains('rv')&&!el.classList.contains('in')) return;
      el.__f=true; el.style.transition='none';
      el.style.opacity=o.toFixed(3); el.style.filter='blur('+((1-o)*8).toFixed(1)+'px)'; el.style.transform='translateY('+(-(1-o)*24).toFixed(1)+'px) scale('+(0.97+0.03*o).toFixed(3)+')';
    });
  }
  window.addEventListener('scroll',function(){ requestAnimationFrame(dissolve); },{passive:true});

  // 6) Gentle 3D tilt on the "how it works" windows (mouse/trackpad only).
  if(window.matchMedia('(hover: hover) and (pointer: fine)').matches){
    Array.prototype.forEach.call(document.querySelectorAll('.frame .win'),function(w){
      var f=w.parentElement;
      f.addEventListener('pointermove',function(e){
        var r=f.getBoundingClientRect(), x=(e.clientX-r.left)/r.width-.5, yy=(e.clientY-r.top)/r.height-.5;
        w.style.transform='perspective(900px) rotateY('+(x*7).toFixed(2)+'deg) rotateX('+(-yy*7).toFixed(2)+'deg) translateZ(0)';
      });
      f.addEventListener('pointerleave',function(){ w.style.transform=''; });
    });
  }
})();
