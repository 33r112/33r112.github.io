(function () {
  "use strict";

  var THEME_KEY = "thread33-theme";
  var root = document.documentElement;

  function currentSystemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function initThemeToggle() {
    var toggle = document.querySelector("[data-theme-toggle]");
    if (!toggle) return;

    toggle.addEventListener("click", function () {
      var active = root.getAttribute("data-theme") || currentSystemTheme();
      var next = active === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (e) {
        /* localStorage unavailable (e.g. private mode) — theme just won't persist */
      }
    });
  }

  function initMobileNav() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var panel = document.querySelector("[data-nav-panel]");
    if (!toggle || !panel) return;

    function closePanel() {
      panel.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }

    function openPanel() {
      panel.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
    }

    toggle.addEventListener("click", function () {
      if (panel.classList.contains("is-open")) {
        closePanel();
      } else {
        openPanel();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closePanel();
    });

    panel.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closePanel);
    });

    window
      .matchMedia("(min-width: 960px)")
      .addEventListener("change", closePanel);
  }

  /* CURRENTLY lives as a single element in the DOM and is relocated between
     the top of main-col (mobile/tablet, and the no-JS fallback position
     since that's its default place in the markup) and right after Profile
     in the sidebar (desktop) — see plan section 3. */
  function initCurrentlyPlacement() {
    var currently = document.getElementById("currently");
    var mainCol = document.querySelector(".main-col");
    var profileSection = document.getElementById("profile-section");
    if (!currently || !mainCol || !profileSection) return;

    var mq = window.matchMedia("(min-width: 960px)");

    function place() {
      if (mq.matches) {
        profileSection.after(currently);
      } else {
        mainCol.prepend(currently);
      }
    }

    place();
    mq.addEventListener("change", place);
  }

  /* Shared by Library (category) and Notes (topic) filter tabs. A
     [data-filter-group] element points at a target list via its
     data-filter-group value (an id selector); clicking a [data-filter]
     button inside it shows/hides the target's [data-category] children. */
  function initFilterTabs() {
    document.querySelectorAll("[data-filter-group]").forEach(function (group) {
      var target = document.querySelector(group.dataset.filterGroup);
      if (!target) return;

      var items = target.querySelectorAll("[data-category]");
      var tabs = group.querySelectorAll("[data-filter]");

      tabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
          tabs.forEach(function (t) {
            t.classList.remove("is-active");
          });
          tab.classList.add("is-active");

          var filter = tab.dataset.filter;
          items.forEach(function (item) {
            item.hidden = filter !== "all" && item.dataset.category !== filter;
          });
        });
      });
    });
  }

  function initConsoleGreeting() {
    console.log(
      "%cTHREAD 33",
      "font-family:monospace;font-weight:700;font-size:14px;"
    );
    console.log(
      '%cif you\'re reading this, you probably grew up clicking "view source" too. welcome.',
      "font-family:monospace;color:#888;"
    );
  }

  document.addEventListener("DOMContentLoaded", function () {
    initThemeToggle();
    initMobileNav();
    initCurrentlyPlacement();
    initFilterTabs();
    initConsoleGreeting();
  });
})();
