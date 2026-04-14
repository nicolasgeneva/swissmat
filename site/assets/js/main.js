/**
 * SwissMAT Sàrl — Main JS
 */
(function () {
  "use strict";

  /* ---------- Language ---------- */
  let currentLang = localStorage.getItem("swissmat-lang") || detectLang();

  function detectLang() {
    const nav = navigator.language || navigator.userLanguage || "fr";
    if (nav.startsWith("de")) return "de";
    if (nav.startsWith("en")) return "en";
    return "fr";
  }

  function setLang(lang) {
    currentLang = lang;
    localStorage.setItem("swissmat-lang", lang);
    document.documentElement.lang = lang;

    // Update meta
    const t = translations;
    document.title = t["meta.title"][lang];
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = t["meta.description"][lang];

    // Translate elements
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      const key = el.getAttribute("data-i18n");
      if (t[key] && t[key][lang]) {
        if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
          el.placeholder = t[key][lang];
        } else if (el.tagName === "OPTION") {
          el.textContent = t[key][lang];
        } else {
          el.innerHTML = t[key][lang];
        }
      }
    });

    // Update active lang button
    document.querySelectorAll(".lang-switcher button").forEach(function (btn) {
      btn.classList.toggle("active", btn.dataset.lang === lang);
    });

    // Update hreflang canonical
    updateCanonical(lang);
  }

  function updateCanonical(lang) {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      const base = canonical.href.replace(/#.*$/, "").replace(/\?.*$/, "");
      canonical.href = base + "#" + lang;
    }
  }

  /* ---------- Navbar ---------- */
  const navbar = document.querySelector(".navbar");
  let lastScroll = 0;

  function onScroll() {
    const scrollY = window.scrollY;
    navbar.classList.toggle("scrolled", scrollY > 60);
    lastScroll = scrollY;

    // Active link highlight
    const sections = document.querySelectorAll("section[id]");
    const navLinks = document.querySelectorAll(".navbar-links a");
    let current = "";

    sections.forEach(function (section) {
      const top = section.offsetTop - 120;
      if (scrollY >= top) current = section.id;
    });

    navLinks.forEach(function (link) {
      link.classList.toggle("active", link.getAttribute("href") === "#" + current);
    });

    // Reveal animations
    document.querySelectorAll(".reveal").forEach(function (el) {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 80) {
        el.classList.add("visible");
      }
    });
  }

  /* ---------- Mobile menu ---------- */
  function initMobileMenu() {
    const toggle = document.querySelector(".navbar-toggle");
    const menu = document.querySelector(".navbar-menu");

    if (!toggle || !menu) return;

    toggle.addEventListener("click", function () {
      menu.classList.toggle("open");
      toggle.classList.toggle("open");
      document.body.style.overflow = menu.classList.contains("open") ? "hidden" : "";
    });

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        menu.classList.remove("open");
        toggle.classList.remove("open");
        document.body.style.overflow = "";
      });
    });
  }

  /* ---------- Contact form ---------- */
  function initContactForm() {
    const form = document.getElementById("contact-form");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      const formData = new FormData(form);
      const msgEl = form.querySelector(".form-message");
      const submitBtn = form.querySelector(".form-submit");

      submitBtn.disabled = true;
      submitBtn.textContent = "...";

      fetch("includes/contact.php", {
        method: "POST",
        body: formData
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          msgEl.className = "form-message " + (data.success ? "success" : "error");
          const key = data.success ? "contact.form.success" : "contact.form.error";
          msgEl.textContent = translations[key][currentLang];
          msgEl.style.display = "block";

          if (data.success) form.reset();

          submitBtn.disabled = false;
          setLang(currentLang); // restore button text
        })
        .catch(function () {
          msgEl.className = "form-message error";
          msgEl.textContent = translations["contact.form.error"][currentLang];
          msgEl.style.display = "block";
          submitBtn.disabled = false;
          setLang(currentLang);
        });
    });
  }

  /* ---------- Partnership variant toggle ---------- */
  function initPartnershipToggle() {
    const toggleBtn = document.getElementById("partnership-toggle");
    if (!toggleBtn) return;

    toggleBtn.addEventListener("click", function () {
      const variantA = document.getElementById("partnerships-variant-a");
      const variantB = document.getElementById("partnerships-variant-b");
      if (!variantA || !variantB) return;

      const showingA = !variantA.classList.contains("hidden");
      variantA.classList.toggle("hidden", showingA);
      variantB.classList.toggle("hidden", !showingA);
    });
  }

  /* ---------- Smooth scroll ---------- */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener("click", function (e) {
        const target = document.querySelector(this.getAttribute("href"));
        if (target) {
          e.preventDefault();
          const offset = navbar.offsetHeight + 10;
          const top = target.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top: top, behavior: "smooth" });
        }
      });
    });
  }

  /* ---------- Init ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    // Language buttons
    document.querySelectorAll(".lang-switcher button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setLang(this.dataset.lang);
      });
    });

    setLang(currentLang);
    initMobileMenu();
    initContactForm();
    initPartnershipToggle();
    initSmoothScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // initial check

    // Reveal on load for above-fold
    setTimeout(function () {
      document.querySelectorAll(".reveal").forEach(function (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) el.classList.add("visible");
      });
    }, 100);
  });
})();
