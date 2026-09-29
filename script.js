/* ==========================================================================
   dxinception — script.js
   Works on every page (index, icc, young-ingenuity, careers, contact).
   Each feature looks for its own elements and quietly does nothing if
   they are not on the page. No dependencies.
   ========================================================================== */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var clamp = function (n, min, max) { return Math.min(Math.max(n, min), max); };

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasIO = "IntersectionObserver" in window;

  root.classList.add("js");

  /* ------------------------------------------------------------------
     1. Footer year  →  <span data-year>
     ------------------------------------------------------------------ */
  function initYear() {
    $$("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  /* ------------------------------------------------------------------
     2. Navigation: mobile menu, current page, section highlight
        .nav  .nav-inner  .nav-links  .menu
        contact.html has no .menu button, so one is created.
     ------------------------------------------------------------------ */
  function initNav() {
    var nav = $(".nav");
    if (!nav) return;
    var inner = $(".nav-inner", nav);
    var links = $(".nav-links", nav);
    if (!inner || !links) return;

    var btn = $(".menu", nav);
    if (!btn) {
      btn = doc.createElement("button");
      btn.className = "menu";
      inner.appendChild(btn);
    }
    btn.type = "button";
    btn.textContent = "\u2630";
    links.id = links.id || "site-nav";
    btn.setAttribute("aria-controls", links.id);
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "Open menu");
    nav.classList.add("has-menu");

    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      btn.textContent = open ? "\u2715" : "\u2630";
    }

    btn.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });
    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    doc.addEventListener("click", function (e) {
      if (!nav.contains(e.target)) setOpen(false);
    });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        btn.focus();
      }
    });
    window.matchMedia("(min-width: 901px)").addEventListener("change", function (e) {
      if (e.matches) setOpen(false);
    });

    /* mark the link for the page you are on */
    var here = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    $$("a", links).forEach(function (a) {
      if (a.classList.contains("btn")) return;
      var href = a.getAttribute("href") || "";
      if (href.indexOf("#") !== -1 || href.indexOf("mailto:") === 0) return;
      if (href.toLowerCase() === here) {
        a.classList.add("is-active");
        a.setAttribute("aria-current", "page");
      }
    });

    /* highlight in-page anchors (#work, #services...) while scrolling */
    var anchors = $$('a[href^="#"]', links).filter(function (a) {
      return a.hash.length > 1 && !a.classList.contains("btn") && $(a.hash);
    });
    if (anchors.length && hasIO) {
      var byTarget = new Map();
      anchors.forEach(function (a) { byTarget.set($(a.hash), a); });
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var link = byTarget.get(en.target);
          if (!link) return;
          if (en.isIntersecting) {
            anchors.forEach(function (a) { a.classList.remove("is-active"); });
            link.classList.add("is-active");
          } else {
            link.classList.remove("is-active");
          }
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      byTarget.forEach(function (_, target) { spy.observe(target); });
    }
  }

  /* ------------------------------------------------------------------
     3. Scroll progress ruler along the top of the page
     ------------------------------------------------------------------ */
  function initProgress() {
    var bar = doc.createElement("div");
    bar.className = "progress";
    bar.setAttribute("aria-hidden", "true");
    doc.body.appendChild(bar);

    var ticking = false;
    function update() {
      ticking = false;
      var max = root.scrollHeight - window.innerHeight;
      var p = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
      bar.style.transform = "scaleX(" + p + ")";
    }
    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ------------------------------------------------------------------
     4. Headline entrance: words rise into place on page load
        .hero h1  .subhero h1  .career-hero h1
     ------------------------------------------------------------------ */
  function initHeadlines() {
    if (reduceMotion) return;
    $$(".hero h1, .subhero h1, .career-hero h1").forEach(function (h) {
      var text = h.textContent.trim();
      if (!text) return;
      h.setAttribute("aria-label", text);
      var frag = doc.createDocumentFragment();
      text.split(/\s+/).forEach(function (word, i) {
        var outer = doc.createElement("span");
        outer.className = "w";
        outer.setAttribute("aria-hidden", "true");
        var inner = doc.createElement("span");
        inner.textContent = word;
        inner.style.setProperty("--i", i);
        outer.appendChild(inner);
        frag.appendChild(outer);
        frag.appendChild(doc.createTextNode(" "));
      });
      h.textContent = "";
      h.appendChild(frag);
    });
  }

  /* ------------------------------------------------------------------
     5. Button arrows: wrap a trailing ↗ ↓ → so it can nudge on hover
     ------------------------------------------------------------------ */
  function initButtons() {
    $$(".btn").forEach(function (b) {
      var last = b.lastChild;
      if (!last || last.nodeType !== 3) return;
      var m = last.textContent.match(/^([\s\S]*?)\s*([\u2197\u2193\u2192\u2191])\s*$/);
      if (!m) return;
      last.textContent = m[1];
      var arrow = doc.createElement("span");
      arrow.className = "arrow" + (m[2] === "\u2193" ? " is-down" : "");
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = m[2];
      b.appendChild(arrow);
    });
  }

  /* ------------------------------------------------------------------
     6. Hero drawing board (index.html)
        .hero-art  .orb  — live crosshair, coordinate tag, draggable shapes
     ------------------------------------------------------------------ */
  function initHeroArt() {
    var art = $(".hero-art");
    if (!art) return;

    function make(cls, text) {
      var el = doc.createElement("div");
      el.className = cls;
      el.setAttribute("aria-hidden", "true");
      if (text) el.textContent = text;
      art.appendChild(el);
      return el;
    }
    var vLine = make("xh-v");
    var hLine = make("xh-h");
    var tag = make("xh-tag", "X:0PX Y:0PX");
    var hint = make("xh-hint", "Click and drag the shapes");

    /* crosshair follows the mouse */
    var px = 0, py = 0, raf = 0;
    function paint() {
      raf = 0;
      tag.textContent = "X:" + px + "PX  Y:" + py + "PX";
      vLine.style.transform = "translateX(" + px + "px)";
      hLine.style.transform = "translateY(" + py + "px)";
      var tx = Math.min(px + 14, art.clientWidth - tag.offsetWidth - 8);
      var ty = Math.min(py + 14, art.clientHeight - tag.offsetHeight - 8);
      tag.style.transform = "translate(" + tx + "px," + ty + "px)";
    }
    art.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      var r = art.getBoundingClientRect();
      px = Math.round(clamp(e.clientX - r.left, 0, r.width));
      py = Math.round(clamp(e.clientY - r.top, 0, r.height));
      art.classList.add("is-hover");
      if (!raf) raf = requestAnimationFrame(paint);
    });
    art.addEventListener("pointerleave", function () {
      art.classList.remove("is-hover");
    });

    /* drag the shapes around */
    var orbs = $$(".orb", art);
    orbs.forEach(function (orb) {
      orb.setAttribute("aria-hidden", "true");
      orb.addEventListener("pointerdown", function (e) {
        if (e.button !== 0) return;
        e.preventDefault();

        var ar = art.getBoundingClientRect();
        var or = orb.getBoundingClientRect();
        orb.style.left = or.left - ar.left + "px";
        orb.style.top = or.top - ar.top + "px";
        var dx = e.clientX - or.left;
        var dy = e.clientY - or.top;

        orbs.forEach(function (o) { o.style.zIndex = 1; });
        orb.style.zIndex = 3;
        orb.classList.add("is-dragging");
        hint.classList.add("is-hidden");
        orb.setPointerCapture(e.pointerId);

        function move(ev) {
          var r = art.getBoundingClientRect();
          orb.style.left = clamp(ev.clientX - r.left - dx, 0, r.width - orb.offsetWidth) + "px";
          orb.style.top = clamp(ev.clientY - r.top - dy, 0, r.height - orb.offsetHeight) + "px";
        }
        function up() {
          orb.classList.remove("is-dragging");
          orb.removeEventListener("pointermove", move);
          orb.removeEventListener("pointerup", up);
          orb.removeEventListener("pointercancel", up);
        }
        orb.addEventListener("pointermove", move);
        orb.addEventListener("pointerup", up);
        orb.addEventListener("pointercancel", up);
      });
    });

    /* keep shapes inside the frame if the window is resized */
    window.addEventListener("resize", function () {
      orbs.forEach(function (o) {
        if (!o.style.left) return;
        o.style.left = clamp(parseFloat(o.style.left), 0, art.clientWidth - o.offsetWidth) + "px";
        o.style.top = clamp(parseFloat(o.style.top), 0, art.clientHeight - o.offsetHeight) + "px";
      });
    });
  }

  /* ------------------------------------------------------------------
     7. Work tiles: pointer position drives the orange crosshair (.work)
     ------------------------------------------------------------------ */
  function initWorkTiles() {
    $$(".work").forEach(function (tile) {
      tile.addEventListener("pointermove", function (e) {
        if (e.pointerType !== "mouse") return;
        var r = tile.getBoundingClientRect();
        tile.style.setProperty("--mx", e.clientX - r.left + "px");
        tile.style.setProperty("--my", e.clientY - r.top + "px");
      });
    });
  }

  /* ------------------------------------------------------------------
     8. Scroll reveals
        - cards, stats, tiles, feature panels fade up (only those below
          the fold, so nothing flashes on load)
        - timeline steps draw their rule and light up their number
     ------------------------------------------------------------------ */
  function initReveals() {
    var steps = $$(".step");

    if (reduceMotion || !hasIO) {
      steps.forEach(function (s) { s.classList.add("is-in"); });
      return;
    }

    function once(options) {
      return new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("is-in");
            obs.unobserve(en.target);
          }
        });
      }, options);
    }

    var reveal = once({ threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    var vh = window.innerHeight;
    $$(".stat, .card, .work, .feature, .cta").forEach(function (el) {
      if (el.getBoundingClientRect().top < vh * 0.92) return;
      var siblings = Array.prototype.slice.call(el.parentElement.children);
      el.style.setProperty("--i", siblings.indexOf(el) % 3);
      el.setAttribute("data-reveal", "");
      reveal.observe(el);
    });

    var stepObs = once({ threshold: 0.4 });
    steps.forEach(function (s) { stepObs.observe(s); });
  }

  /* ------------------------------------------------------------------
     9. Forms (contact.html, careers.html): friendly button feedback
        Both forms open the visitor's email app via mailto.
     ------------------------------------------------------------------ */
  function initForms() {
    $$("form.form").forEach(function (form) {
      var submit = $('button[type="submit"]', form);
      if (!submit) return;
      var original = submit.innerHTML;
      form.addEventListener("submit", function () {
        submit.disabled = true;
        submit.textContent = "Opening your email app\u2026";
        setTimeout(function () {
          submit.disabled = false;
          submit.innerHTML = original;
        }, 4000);
      });
    });
  }

  /* ------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------ */
  function boot() {
    initYear();
    initNav();
    initProgress();
    initHeadlines();
    initButtons();
    initHeroArt();
    initWorkTiles();
    initReveals();
    initForms();
  }

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
