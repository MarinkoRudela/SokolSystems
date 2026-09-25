(function(){
  var code=(new URLSearchParams(location.search).get('c')||'').trim();
  var state=document.getElementById('state'), app=document.getElementById('app');
  var data=null, busy=false;
  function el(tag,cls,text){var e=document.createElement(tag); if(cls)e.className=cls; if(text!=null)e.textContent=text; return e;}
  function fail(msg){state.textContent=msg; state.className='pstate bad'; app.hidden=true;}
  function fmt(d){try{return new Date(d).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})}catch(e){return ''}}
  var pillCls={'New':'p-new','In progress':'p-prog','Needs info':'p-coral','Delivered':'p-done','Revision requested':'p-coral','Approved':'p-done','Info received':'p-prog'};
  function api(method,body){
    var url='/api/portal'+(method==='GET'?'?c='+encodeURIComponent(code):'');
    return fetch(url,{method:method,headers:{'Content-Type':'application/json'},body:body?JSON.stringify(Object.assign({c:code},body)):undefined})
      .then(function(r){return r.json().catch(function(){return {}}).then(function(j){if(!r.ok)throw new Error(j.error||'Something went wrong. Please try again.');return j;});});
  }
  function setLink(id,href){var a=document.getElementById(id); if(href){a.href=href;a.hidden=false;a.target='_blank';a.rel='noopener noreferrer';}}

  function renderList(){
    var list=document.getElementById('req-list'); list.textContent='';
    document.getElementById('req-empty').hidden=data.requests.length>0;
    data.requests.forEach(function(r){
      var li=el('li','ritem'), top=el('div','rtop');
      top.appendChild(el('span','rtitle',r.title)); top.appendChild(el('span','pill '+(pillCls[r.status]||'p-new'),r.status)); li.appendChild(top);
      li.appendChild(el('p','rmeta',[r.type,fmt(r.created)].filter(Boolean).join(' · ')));
      if(r.delivery){var a=el('a','rfiles','View delivered files'); a.href=r.delivery; a.target='_blank'; a.rel='noopener noreferrer'; li.appendChild(a);}
      if(r.status==='Revision requested') li.appendChild(el('p','rnote','Changes requested — we\u2019re on it.'));
      if(r.status==='Info received') li.appendChild(el('p','rnote','Answer received — thanks! We\u2019re back on it.'));
      if(r.status==='Needs info'){
        var q=el('div','rq'); q.appendChild(el('p','rq-label','We have a question')); q.appendChild(el('p','rq-text',r.question||'Check your email for our question.'));
        var qid='ans-'+r.id, ql=el('label',null,'Your answer'), qa=el('textarea'); ql.htmlFor=qid; qa.id=qid; qa.maxLength=4000;
        var qs=el('button','btn btn-main btn-sm','Send answer'); qs.type='button'; var qm=el('p','form-status'); qm.setAttribute('role','status');
        q.appendChild(ql); q.appendChild(qa); q.appendChild(qs); q.appendChild(qm); li.appendChild(q);
        qs.addEventListener('click',function(){
          if(busy)return; if(qa.value.trim().length<2){qm.className='form-status bad';qm.textContent='Type your answer first.';return;}
          busy=true; qs.disabled=true;
          api('POST',{action:'answer',requestId:r.id,answer:qa.value}).then(function(){load();})
            .catch(function(e){qm.className='form-status bad';qm.textContent=e.message;qs.disabled=false;})
            .finally(function(){busy=false;});
        });
      }
      if(r.status==='Delivered'){
        var acts=el('div','racts'), ok=el('button','btn btn-main btn-sm','Approve'), ch=el('button','btn btn-soft btn-sm','Request changes');
        ok.type='button'; ch.type='button'; acts.appendChild(ok); acts.appendChild(ch); li.appendChild(acts);
        var box=el('div','rrev'); box.hidden=true;
        var lab=el('label',null,'What should we change?'), ta=el('textarea'); var id='rev-'+r.id; lab.htmlFor=id; ta.id=id; ta.maxLength=2000;
        var send=el('button','btn btn-main btn-sm','Send changes'); send.type='button';
        box.appendChild(lab); box.appendChild(ta); box.appendChild(send); li.appendChild(box);
        var msg=el('p','form-status'); msg.setAttribute('role','status'); li.appendChild(msg);
        ok.addEventListener('click',function(){act(r.id,'approve',null,msg,[ok,ch]);});
        ch.addEventListener('click',function(){box.hidden=!box.hidden; if(!box.hidden)ta.focus();});
        send.addEventListener('click',function(){act(r.id,'revise',ta.value,msg,[ok,ch,send]);});
      }
      list.appendChild(li);
    });
  }
  function act(id,action,note,msg,btns){
    if(busy)return; busy=true; btns.forEach(function(b){b.disabled=true});
    api('POST',{action:action,requestId:id,note:note||''}).then(function(){load();})
      .catch(function(e){msg.className='form-status bad';msg.textContent=e.message;btns.forEach(function(b){b.disabled=false});})
      .finally(function(){busy=false;});
  }
  function fillOptions(){
    var o=data.options, sel=document.getElementById('r-type');
    if(!sel.options.length){ sel.appendChild(new Option('Choose a type','')); o.types.forEach(function(t){sel.appendChild(new Option(t,t))}); }
    [['r-platforms','platforms',o.platforms],['r-sizes','sizes',o.sizes]].forEach(function(g){
      var box=document.getElementById(g[0]); if(box.childNodes.length) return;
      g[2].forEach(function(v,i){var lab=el('label','check'),cb=el('input');cb.type='checkbox';cb.name=g[1];cb.value=v;cb.id=g[0]+'-'+i;lab.htmlFor=cb.id;lab.appendChild(cb);lab.appendChild(document.createTextNode(' '+v));box.appendChild(lab);});
    });
  }
  function load(){
    return api('GET').then(function(j){
      data=j; state.hidden=true; app.hidden=false;
      document.getElementById('p-name').textContent=j.client.name+'.';
      setLink('p-drive',j.client.drive); setLink('p-guide',j.client.guide); setLink('p-billing',j.client.billing);
      var b=document.getElementById('p-banner'), s=j.client.status, form=document.getElementById('req-form');
      var msgs={'Paused':'Your subscription is paused. Resume it in Billing to send new requests.','Payment issue':'Your latest payment didn\u2019t go through. Update your card in Billing to keep requests open.','Cancelled':'Your subscription has ended. Your delivered files stay yours in your drive folder.'};
      b.hidden=!msgs[s]; b.textContent=msgs[s]||'';
      Array.prototype.forEach.call(form.elements,function(x){x.disabled=!!msgs[s]});
      fillOptions(); renderList();
    });
  }
  function readFiles(input){
    var files=Array.prototype.slice.call(input.files||[]);
    return Promise.all(files.map(function(f){return new Promise(function(res,rej){var r=new FileReader();r.onload=function(){res({name:f.name,type:f.type,data:String(r.result).split(',')[1]||''})};r.onerror=rej;r.readAsDataURL(f);});}));
  }
  var form=document.getElementById('req-form'), st=document.getElementById('req-status');
  form.addEventListener('submit',function(e){
    e.preventDefault(); if(busy)return;
    var title=form.title.value.trim(), type=form.type.value, brief=form.brief.value.trim(), input=form.files;
    var files=Array.prototype.slice.call(input.files||[]), total=files.reduce(function(s,f){return s+f.size},0);
    var err=title.length<3?'Give your request a short name.':!type?'Choose a type.':brief.length<10?'Add a little more detail to the brief.':
      files.length>data.options.maxFiles?'Attach up to 3 files.':total>data.options.maxBytes?'Files are over 2.5 MB. Add them to your drive folder instead.':'';
    if(err){st.className='form-status bad';st.textContent=err;return;}
    var pick=function(n){return Array.prototype.map.call(form.querySelectorAll('input[name="'+n+'"]:checked'),function(c){return c.value})};
    busy=true; var btn=form.querySelector('button[type="submit"]'); btn.disabled=true; btn.textContent='Sending…'; st.className='form-status'; st.textContent='';
    readFiles(input).then(function(fs){return api('POST',{action:'create',title:title,type:type,brief:brief,platforms:pick('platforms'),sizes:pick('sizes'),files:fs});})
      .then(function(r){form.reset(); st.className='form-status ok'; st.textContent='Request sent. We\u2019ll get started and keep you posted here.'+(r.skipped?' (One file could not be attached — please add it to your drive folder.)':''); return load();})
      .catch(function(e){st.className='form-status bad';st.textContent=e.message;})
      .finally(function(){busy=false;btn.disabled=false;btn.textContent='Send request';});
  });
  if(!/^[a-f0-9]{48}$/.test(code)) fail('This portal link isn\u2019t complete. Use the link from your welcome email, or email marinko@sokolsystems.io.');
  else load().catch(function(e){fail(e.message)});
})();
