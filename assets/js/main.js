/* ==========================================================================
   Al Fatah Cricket Club
   Site behaviour. No dependencies, no build step.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------
     Header: solid background once the page scrolls past the hero edge
     ------------------------------------------------------------------ */
  function initHeader() {
    var header = document.querySelector(".site-header");
    if (!header) return;

    var ticking = false;
    function update() {
      header.classList.toggle("is-stuck", window.scrollY > 40);
      ticking = false;
    }
    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
    update();
  }

  /* ------------------------------------------------------------------
     Mobile navigation
     ------------------------------------------------------------------ */
  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var drawer = document.getElementById("mobile-nav");
    if (!toggle || !drawer) return;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      drawer.classList.toggle("is-open", open);
      document.body.classList.toggle("nav-open", open);
      if (open) {
        var first = drawer.querySelector("a, button");
        if (first) first.focus();
      }
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    drawer.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && drawer.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth >= 1020 && drawer.classList.contains("is-open")) setOpen(false);
    });
  }

  /* ------------------------------------------------------------------
     Scroll reveal
     ------------------------------------------------------------------ */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    items.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------------
     Counting stats
     ------------------------------------------------------------------ */
  function initCounters() {
    var counters = document.querySelectorAll("[data-count]");
    if (!counters.length) return;

    function run(el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var suffix = el.getAttribute("data-suffix") || "";
      var prefix = el.getAttribute("data-prefix") || "";

      if (reduceMotion) {
        el.textContent = prefix + target + suffix;
        return;
      }

      var duration = 1400;
      var start = null;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + Math.round(target * eased) + suffix;
        if (p < 1) window.requestAnimationFrame(step);
      }
      window.requestAnimationFrame(step);
    }

    if (!("IntersectionObserver" in window)) {
      counters.forEach(run);
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            run(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------------
     Squad filters
     ------------------------------------------------------------------ */
  function initFilters() {
    var chips = document.querySelectorAll("[data-filter]");
    var targets = document.querySelectorAll("[data-category]");
    if (!chips.length || !targets.length) return;

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var value = chip.getAttribute("data-filter");
        chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c === chip)); });
        targets.forEach(function (t) {
          var cats = (t.getAttribute("data-category") || "").split(/\s+/);
          var show = value === "all" || cats.indexOf(value) !== -1;
          t.hidden = !show;
        });
      });
    });
  }

  /* ------------------------------------------------------------------
     Gallery lightbox
     ------------------------------------------------------------------ */
  function initLightbox() {
    var triggers = Array.prototype.slice.call(document.querySelectorAll(".gallery-item"));
    var box = document.getElementById("lightbox");
    if (!triggers.length || !box) return;

    var imgEl = box.querySelector("img");
    var capEl = box.querySelector(".lightbox-caption");
    var closeBtn = box.querySelector(".lightbox-close");
    var prevBtn = box.querySelector(".lightbox-nav.prev");
    var nextBtn = box.querySelector(".lightbox-nav.next");
    var index = 0;
    var lastFocus = null;

    function show(i) {
      index = (i + triggers.length) % triggers.length;
      var trigger = triggers[index];
      var full = trigger.getAttribute("data-full") || trigger.querySelector("img").src;
      var caption = trigger.getAttribute("data-caption") || trigger.querySelector("img").alt || "";
      imgEl.src = full;
      imgEl.alt = caption;
      capEl.textContent = caption;
    }

    function open(i) {
      lastFocus = document.activeElement;
      show(i);
      box.classList.add("is-open");
      box.setAttribute("aria-hidden", "false");
      document.body.classList.add("nav-open");
      closeBtn.focus();
    }

    function close() {
      box.classList.remove("is-open");
      box.setAttribute("aria-hidden", "true");
      document.body.classList.remove("nav-open");
      if (lastFocus) lastFocus.focus();
    }

    triggers.forEach(function (t, i) {
      t.addEventListener("click", function () { open(i); });
    });

    closeBtn.addEventListener("click", close);
    prevBtn.addEventListener("click", function () { show(index - 1); });
    nextBtn.addEventListener("click", function () { show(index + 1); });
    box.addEventListener("click", function (e) { if (e.target === box) close(); });

    document.addEventListener("keydown", function (e) {
      if (!box.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(index - 1);
      if (e.key === "ArrowRight") show(index + 1);
    });
  }

  /* ------------------------------------------------------------------
     Forms

     The site is static, so there is no server to post to. Each form
     opens the visitor's email client with the answers already filled in,
     which works on any host with zero setup.

     Each form carries data-whatsapp with a number in international format
     (no plus sign, no spaces). Submitting opens WhatsApp with every answer
     already written out, so the club receives it as a normal message.

     To switch to a hosted form service instead, put the endpoint URL in
     the form's data-endpoint attribute and this script will POST to it.
     ------------------------------------------------------------------ */
  function initForms() {
    var forms = document.querySelectorAll("form[data-form]");
    if (!forms.length) return;

    forms.forEach(function (form) {
      var status = form.querySelector(".form-status");

      function say(message, ok) {
        if (!status) return;
        status.textContent = message;
        status.className = "form-status is-visible " + (ok ? "ok" : "err");
      }

      form.addEventListener("submit", function (e) {
        e.preventDefault();

        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }

        var data = new FormData(form);
        var endpoint = form.getAttribute("data-endpoint");

        if (endpoint) {
          say("Sending...", true);
          fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } })
            .then(function (r) {
              if (!r.ok) throw new Error("Request failed");
              form.reset();
              say("Thanks. Your message is on its way and we will reply shortly.", true);
            })
            .catch(function () {
              say("Something went wrong. Please email us directly instead.", false);
            });
          return;
        }

        var subject = form.getAttribute("data-subject") || "Website enquiry";
        var lines = [];
        data.forEach(function (value, key) {
          if (key.charAt(0) === "_") return;
          var label = key.replace(/[-_]/g, " ").replace(/\b\w/g, function (m) { return m.toUpperCase(); });
          lines.push(label + ": " + value);
        });

        // Preferred route: open WhatsApp with the answers already written out.
        // Works on phones and on desktop through WhatsApp Web.
        var wa = form.getAttribute("data-whatsapp");
        if (wa) {
          var text = subject + "\n\n" + lines.join("\n");
          window.open("https://wa.me/" + wa + "?text=" + encodeURIComponent(text), "_blank", "noopener");
          say("WhatsApp is opening with your details filled in. Press send to finish.", true);
          return;
        }

        // Fallback for anyone without WhatsApp: hand it to their email app.
        var to = form.getAttribute("data-mailto");
        if (!to) {
          say("No contact route is configured on this form yet.", false);
          return;
        }
        window.location.href =
          "mailto:" + to +
          "?subject=" + encodeURIComponent(subject) +
          "&body=" + encodeURIComponent(lines.join("\n"));
        say("Your email app should now open with the details filled in. Press send to finish.", true);
      });
    });
  }

  /* ------------------------------------------------------------------
     Footer year
     ------------------------------------------------------------------ */
  function initYear() {
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* ------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------ */
  function boot() {
    initHeader();
    initNav();
    initReveal();
    initCounters();
    initFilters();
    initLightbox();
    initForms();
    initYear();
  }

  // Tells the inline head script that this file loaded. If it never runs, that
  // script strips the "js" class after 3s so hidden sections become visible
  // again rather than the page appearing blank.
  window.__afccReady = true;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
