(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var yr = document.getElementById('yr') || document.querySelector('[data-year]');
  if (yr) yr.textContent = new Date().getFullYear();

  if (reduce || !('IntersectionObserver' in window)) return;

  /* --- Rules drawn on as they enter view --- */
  var ruleIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('inked');
      ruleIO.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  document.querySelectorAll('.rule, .case + .case').forEach(function (el) {
    ruleIO.observe(el);
  });

  /* --- Case-stat figures roll up from zero --- */
  var figs = document.querySelectorAll('.case-stat-fig');
  var parsed = [];
  figs.forEach(function (el) {
    var m = /^(\D*)([\d.]+)(.*)$/.exec(el.textContent.trim());
    if (!m) return;
    var dec = (m[2].split('.')[1] || '').length;
    parsed.push({ el: el, pre: m[1], target: parseFloat(m[2]), suf: m[3], dec: dec });
    el.textContent = m[1] + (0).toFixed(dec) + m[3];
  });
  function roll(item) {
    var dur = 750, start;
    function frame(t) {
      if (!start) start = t;
      var p = Math.min((t - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      item.el.textContent = item.pre + (item.target * eased).toFixed(item.dec) + item.suf;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  var figIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var item = parsed.filter(function (x) { return x.el === e.target; })[0];
      if (item) roll(item);
      figIO.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -15% 0px' });
  parsed.forEach(function (x) { figIO.observe(x.el); });
})();
