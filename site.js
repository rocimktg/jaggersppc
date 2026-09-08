(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var yr = document.getElementById('yr') || document.querySelector('[data-year]');
  if (yr) yr.textContent = new Date().getFullYear();

  /* --- Contact form: submit in place, swap in a confirmation ---
     Falls back to a normal POST (Netlify's own success page) without JS. */
  var form = document.querySelector('form.contact-form');
  if (form && window.fetch) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var err = form.querySelector('.form-error');
      if (err) err.hidden = true;
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      fetch(form.getAttribute('action') || '/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString()
      }).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        var done = document.createElement('p');
        done.className = 'form-done';
        done.setAttribute('role', 'status');
        done.tabIndex = -1;
        done.textContent = 'Thanks — your message is in. I’ll get back to you shortly.';
        form.replaceWith(done);
        done.focus();
      }).catch(function () {
        if (btn) { btn.disabled = false; btn.textContent = 'Send message'; }
        if (err) err.hidden = false;
      });
    });
  }

  /* --- Sticky nav: show the hairline once the page is scrolled --- */
  var navbar = document.querySelector('.navbar');
  if (navbar) {
    var setStuck = function () {
      navbar.classList.toggle('is-stuck', window.scrollY > 2);
    };
    setStuck();
    window.addEventListener('scroll', setStuck, { passive: true });
  }

  /* --- Glossary terms: turn the title tooltip into a tap/keyboard toggle --- */
  Array.prototype.forEach.call(document.querySelectorAll('.term[title]'), function (term) {
    var def = term.getAttribute('title');
    term.removeAttribute('title');
    term.setAttribute('role', 'button');
    term.setAttribute('tabindex', '0');
    term.setAttribute('aria-expanded', 'false');
    var pop = null;
    var toggle = function () {
      if (pop) {
        pop.remove();
        pop = null;
        term.setAttribute('aria-expanded', 'false');
      } else {
        pop = document.createElement('span');
        pop.className = 'term-pop';
        pop.textContent = def;
        term.insertAdjacentElement('afterend', pop);
        term.setAttribute('aria-expanded', 'true');
      }
    };
    term.addEventListener('click', toggle);
    term.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        toggle();
      }
    });
  });

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
