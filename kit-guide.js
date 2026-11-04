// Kit training guide: progress bar and "Mark complete" buttons.
// Progress lives only in this browser (localStorage). If storage is blocked, ticks still work for this visit.
(function () {
  var KEY = 'sokol-kit-guide-v1';
  var steps = Array.prototype.slice.call(document.querySelectorAll('[data-step]'));
  if (!steps.length) return;
  var ids = steps.map(function (s) { return s.getAttribute('data-step'); });
  var done = {};

  function load() {
    try { var v = JSON.parse(localStorage.getItem(KEY) || '[]'); if (Array.isArray(v)) v.forEach(function (id) { done[id] = true; }); } catch (e) {}
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(ids.filter(function (id) { return done[id]; }))); } catch (e) {}
  }

  var fill = document.getElementById('g-fill');
  var count = document.getElementById('g-count');
  var cont = document.getElementById('g-continue');
  var finish = document.getElementById('g-finish');

  function render() {
    var n = ids.filter(function (id) { return done[id]; }).length;
    var pct = Math.round(n / ids.length * 100);
    if (fill) fill.style.width = pct + '%';
    if (count) count.textContent = n + ' of ' + ids.length + ' steps done' + (n ? ' (' + pct + '%)' : '');
    steps.forEach(function (s) {
      var id = s.getAttribute('data-step');
      var b = s.querySelector('[data-done]');
      s.classList.toggle('is-done', !!done[id]);
      if (b) {
        b.setAttribute('aria-pressed', done[id] ? 'true' : 'false');
        var l = b.querySelector('.g-lbl'); if (l) l.textContent = done[id] ? 'Done' : 'Mark complete';
      }
      var t = document.querySelector('[data-toc="' + id + '"]');
      if (t) t.classList.toggle('is-done', !!done[id]);
    });
    var next = ids.filter(function (id) { return !done[id]; })[0];
    if (cont) {
      if (!n) { cont.textContent = 'Start at step 1'; cont.setAttribute('href', '#' + ids[0]); }
      else if (next) { cont.textContent = 'Continue: step ' + (ids.indexOf(next) + 1); cont.setAttribute('href', '#' + next); }
      else { cont.textContent = 'All steps done'; cont.setAttribute('href', '#g-finish'); }
    }
    if (finish) finish.hidden = !!next;
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-done]');
    if (b) {
      var id = b.getAttribute('data-done');
      done[id] = !done[id];
      save(); render();
      if (done[id]) {
        var i = ids.indexOf(id), nx = ids.slice(i + 1).filter(function (x) { return !done[x]; })[0];
        var el = nx && document.getElementById(nx);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }
    if (e.target.id === 'g-reset') {
      var r = e.target;
      if (r.getAttribute('data-armed') !== '1') {          // two clicks, so progress isn't wiped by accident
        r.setAttribute('data-armed', '1'); r.textContent = 'Click again to reset';
        setTimeout(function () { r.removeAttribute('data-armed'); r.textContent = 'Reset my progress'; }, 4000);
        return;
      }
      r.removeAttribute('data-armed'); r.textContent = 'Reset my progress';
      done = {}; save(); render();
    }
  });

  load(); render();
})();
