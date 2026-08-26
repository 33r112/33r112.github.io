(function () {
  "use strict";

  var root = document.documentElement;

  /* small always-on local-time text in the corner of the home status row */
  function initClock() {
    var el = document.querySelector("[data-clock]");
    if (!el) return;

    function update() {
      var d = new Date();
      var hh = String(d.getHours()).padStart(2, "0");
      var mm = String(d.getMinutes()).padStart(2, "0");
      el.textContent = hh + ":" + mm;
    }

    update();
    setInterval(update, 15000);
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

  /* temporary: color/size presets + sliders + editable number boxes, all
     kept in sync with each other. Remove this function (and all the
     buttons/sliders/number boxes in index.html) once values are picked. */
  function initBgTestControls() {
    var bg = document.querySelector(".home-frame__bg");
    var filterSliders = document.querySelectorAll("[data-filter-slider]");
    var sizeSlider = document.querySelector("[data-size-slider]");
    if (!bg || (!filterSliders.length && !sizeSlider)) return;

    var NATIVE_W = 320;
    var NATIVE_H = 200;

    var colorPresets = {
      none: { "hue-rotate": 0, grayscale: 0, saturate: 100, brightness: 100 },
      blue: { "hue-rotate": 60, grayscale: 0, saturate: 100, brightness: 100 },
      yellow: { "hue-rotate": 180, grayscale: 0, saturate: 100, brightness: 100 },
      red: { "hue-rotate": 120, grayscale: 0, saturate: 100, brightness: 100 },
      white: { "hue-rotate": 0, grayscale: 100, saturate: 100, brightness: 130 },
    };

    function filterSlider(fn) {
      return document.querySelector('[data-filter-slider="' + fn + '"]');
    }

    function filterNumber(fn) {
      return document.querySelector('[data-filter-number="' + fn + '"]');
    }

    function applyFilter() {
      var parts = [];
      filterSliders.forEach(function (slider) {
        parts.push(
          slider.dataset.filterSlider + "(" + slider.value + slider.dataset.unit + ")"
        );
      });
      bg.style.filter = parts.join(" ");
    }

    function setFilterValue(fn, value) {
      var slider = filterSlider(fn);
      var number = filterNumber(fn);
      if (slider) slider.value = value;
      if (number) number.value = value;
    }

    function applySize(pct) {
      if (pct === "auto") {
        bg.style.backgroundSize = "auto";
        return;
      }
      var scale = pct / 100;
      bg.style.backgroundSize =
        NATIVE_W * scale + "px " + NATIVE_H * scale + "px";
    }

    function setSizeValue(pct) {
      if (sizeSlider) sizeSlider.value = pct;
      var number = document.querySelector("[data-size-number]");
      if (number) number.value = pct;
    }

    // filter sliders <-> number boxes
    filterSliders.forEach(function (slider) {
      slider.addEventListener("input", function () {
        var number = filterNumber(slider.dataset.filterSlider);
        if (number) number.value = slider.value;
        applyFilter();
      });
    });

    document.querySelectorAll("[data-filter-number]").forEach(function (number) {
      number.addEventListener("input", function () {
        var slider = filterSlider(number.dataset.filterNumber);
        if (slider) slider.value = number.value;
        applyFilter();
      });
    });

    // size slider <-> number box
    if (sizeSlider) {
      sizeSlider.addEventListener("input", function () {
        var number = document.querySelector("[data-size-number]");
        if (number) number.value = sizeSlider.value;
        applySize(Number(sizeSlider.value));
      });
    }

    var sizeNumber = document.querySelector("[data-size-number]");
    if (sizeNumber) {
      sizeNumber.addEventListener("input", function () {
        if (sizeSlider) sizeSlider.value = sizeNumber.value;
        applySize(Number(sizeNumber.value));
      });
    }

    // color preset buttons — update every filter slider/number to match,
    // then apply
    document.querySelectorAll("[data-color-preset]").forEach(function (button) {
      button.addEventListener("click", function () {
        var preset = colorPresets[button.dataset.colorPreset];
        if (!preset) return;
        Object.keys(preset).forEach(function (fn) {
          setFilterValue(fn, preset[fn]);
        });
        applyFilter();
      });
    });

    // size preset buttons
    document.querySelectorAll("[data-size-preset]").forEach(function (button) {
      button.addEventListener("click", function () {
        var raw = button.dataset.sizePreset;
        if (raw === "auto") {
          setSizeValue(100);
          applySize("auto");
        } else {
          var pct = Number(raw);
          setSizeValue(pct);
          applySize(pct);
        }
      });
    });

    applyFilter();
    if (sizeSlider) applySize(Number(sizeSlider.value));
  }

  /* temporary: background image toggle, remove this function (and the
     buttons in index.html) once a choice is made */
  function initBgImageToggle() {
    var bg = document.querySelector(".home-frame__bg");
    var buttons = document.querySelectorAll("[data-bg-image]");
    if (!bg || !buttons.length) return;

    var images = {
      stars: "img/backgrounds/stars.gif",
      bricks: "img/backgrounds/bluebrick.jpg",
      vgrid: "img/backgrounds/vgrid.jpg",
    };

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        var src = images[button.dataset.bgImage];
        if (!src) return;
        bg.style.backgroundImage = 'url("' + src + '")';
      });
    });
  }

  /* Notes list accordion: clicking a row's preview toggles its sibling
     .notes-expand open/closed in place, instead of navigating to a
     separate article page. Rows above/below stay put; only the flow
     below the opened row shifts down. */
  function initNotesAccordion() {
    var triggers = document.querySelectorAll("[data-notes-toggle]");
    if (!triggers.length) return;

    function toggle(trigger) {
      var expand = document.getElementById(trigger.dataset.notesToggle);
      if (!expand) return;
      var willOpen = expand.hidden;
      expand.hidden = !willOpen;
      trigger.setAttribute("aria-expanded", String(willOpen));
    }

    triggers.forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        toggle(trigger);
      });

      trigger.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggle(trigger);
        }
      });
    });
  }

  /* the sky banner + character art backgrounds are intentionally NOT part
     of any .astro page template. Astro's ClientRouter replaces <body>
     wholesale on every navigation (only re-attaching transition:persist
     elements that also have a matching one in the *new* page's own
     template) — for a large fixed background image, that reparenting
     itself was enough to force a visible repaint even with the
     transition's fade animation fully disabled via transition:animate.
     Creating these once as direct children of <html> (a sibling of
     <body>, which Astro never replaces — only <body>'s content and
     <html>'s attributes are touched by a navigation) keeps them
     completely outside anything the router ever touches, so there is
     nothing left for it to disturb. See base.css for the matching
     stacking-context change (the true page background now lives on
     <html>, not <body>, so body can stay transparent and not paint over
     this layer). */
  function initPersistentBackground() {
    var banner = document.createElement("div");
    banner.className = "notes-top-banner";
    banner.setAttribute("aria-hidden", "true");

    var hikari = document.createElement("div");
    hikari.className = "notes-char-bg notes-char-bg--left";
    hikari.id = "notes-char-hikari";
    hikari.setAttribute("aria-hidden", "true");

    var homura = document.createElement("div");
    homura.className = "notes-char-bg notes-char-bg--right";
    homura.id = "notes-char-homura";
    homura.setAttribute("aria-hidden", "true");

    root.appendChild(banner);
    root.appendChild(hikari);
    root.appendChild(homura);

    syncPersistentBackground();
  }

  /* shows the background only on pages built on InnerLayout (marked by
     .notes-shell) and hides it on the home page. Re-run on every
     astro:page-load, since <body>'s content has just been replaced by
     the time that event fires. */
  function syncPersistentBackground() {
    var visible = !!document.querySelector(".notes-shell");
    document
      .querySelectorAll(".notes-top-banner, #notes-char-hikari, #notes-char-homura")
      .forEach(function (el) {
        el.hidden = !visible;
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

  // runs exactly once for the whole client-router session — document
  // itself is never torn down across astro:page-load transitions, so
  // anything re-run here on every soft navigation would either
  // duplicate (a listener) or recreate (DOM nodes) needlessly
  initConsoleGreeting();
  initPersistentBackground();

  // astro:page-load fires after the initial load AND after every
  // subsequent soft navigation (DOMContentLoaded only ever saw the
  // former) — everything that depends on page-specific DOM must re-run
  // here so it rebinds to whatever just got swapped in
  document.addEventListener("astro:page-load", function () {
    initClock();
    initBgTestControls();
    initBgImageToggle();
    initFilterTabs();
    initNotesAccordion();
    syncPersistentBackground();
  });
})();
