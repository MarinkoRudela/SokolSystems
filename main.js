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
