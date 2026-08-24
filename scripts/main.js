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

  /* hidden egg: press "3" twice quickly (echoing the site's own "33") to
     briefly light up the thread line and reveal a small hidden line of
     text near it. Purely decorative, no functional purpose. */
  function initHiddenEgg() {
    var lastPress = 0;
    var timeoutId;

    document.addEventListener("keydown", function (event) {
      if (event.key !== "3") return;
      var now = Date.now();
      if (now - lastPress < 500) {
        root.classList.add("egg-active");
        clearTimeout(timeoutId);
        timeoutId = setTimeout(function () {
          root.classList.remove("egg-active");
        }, 1600);
        lastPress = 0;
      } else {
        lastPress = now;
      }
    });
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

  /* temporary: Notes page background image filter/size test controls,
     same mechanism as the home page's initBgTestControls(). Remove this
     function (and the three button rows in notes.html) once values are
     picked. */
  function initNotesBgTestControls() {
    var hikari = document.getElementById("notes-char-hikari");
    var homura = document.getElementById("notes-char-homura");
    var targets = document.querySelectorAll(".notes-char-bg");
    var filterSliders = document.querySelectorAll("[data-notesbg-filter-slider]");
    var offsetYSlider = document.querySelector("[data-notesbg-offset-y-slider]");
    var offsetYNumber = document.querySelector("[data-notesbg-offset-y]");
    var offsetXSlider = document.querySelector("[data-notesbg-offset-x-slider]");
    var offsetXNumber = document.querySelector("[data-notesbg-offset-x]");
    var scaleSlider = document.querySelector("[data-notesbg-scale-slider]");
    var scaleNumber = document.querySelector("[data-notesbg-scale]");
    var invertButton = document.querySelector("[data-notesbg-invert]");
    if (!targets.length) return;

    var BASE_HEIGHT_VH = 70;
    var inverted = false;

    var colorPresets = {
      none: { "hue-rotate": 0, grayscale: 100, saturate: 100, brightness: 100 },
      blue: { "hue-rotate": 60, grayscale: 0, saturate: 100, brightness: 100 },
      yellow: { "hue-rotate": 180, grayscale: 0, saturate: 100, brightness: 100 },
      red: { "hue-rotate": 120, grayscale: 0, saturate: 100, brightness: 100 },
      white: { "hue-rotate": 0, grayscale: 100, saturate: 100, brightness: 130 },
    };

    function filterSlider(fn) {
      return document.querySelector('[data-notesbg-filter-slider="' + fn + '"]');
    }

    function filterNumber(fn) {
      return document.querySelector('[data-notesbg-filter-number="' + fn + '"]');
    }

    /* invert (if on) is always first in the chain, so the hue/gray/sat/
       bright sliders adjust the already-inverted image, not the original */
    function applyFilter() {
      var parts = [];
      if (inverted) parts.push("invert(100%)");
      filterSliders.forEach(function (slider) {
        parts.push(
          slider.dataset.notesbgFilterSlider + "(" + slider.value + slider.dataset.unit + ")"
        );
      });
      var filterStr = parts.join(" ");
      targets.forEach(function (el) {
        el.style.filter = filterStr;
      });
    }

    function setFilterValue(fn, value) {
      var slider = filterSlider(fn);
      var number = filterNumber(fn);
      if (slider) slider.value = value;
      if (number) number.value = value;
    }

    function applySize(pct) {
      var vh = pct === "auto" ? BASE_HEIGHT_VH : BASE_HEIGHT_VH * (pct / 100);
      targets.forEach(function (el) {
        el.style.height = vh + "vh";
      });
    }

    /* vertical offset + scale apply the same way to both, on top of the
       -50% that keeps them vertically centered */
    function applyTransform() {
      var y = offsetYSlider ? offsetYSlider.value : 0;
      var scale = scaleSlider ? Number(scaleSlider.value) / 100 : 1;
      var transform = "translateY(calc(-50% + " + y + "px)) scale(" + scale + ")";
      targets.forEach(function (el) {
        el.style.transform = transform;
      });
    }

    /* horizontal offset is mirrored around center: hikari's distance from
       the left edge and homura's distance from the right edge move by the
       same amount, so they only ever move symmetrically (both toward
       center or both toward their own edge), never both the same way */
    function applyOffsetX() {
      var x = offsetXSlider ? offsetXSlider.value : 6;
      if (hikari) hikari.style.left = x + "rem";
      if (homura) homura.style.right = x + "rem";
    }

    filterSliders.forEach(function (slider) {
      slider.addEventListener("input", function () {
        var number = filterNumber(slider.dataset.notesbgFilterSlider);
        if (number) number.value = slider.value;
        applyFilter();
      });
    });

    document.querySelectorAll("[data-notesbg-filter-number]").forEach(function (number) {
      number.addEventListener("input", function () {
        var slider = filterSlider(number.dataset.notesbgFilterNumber);
        if (slider) slider.value = number.value;
        applyFilter();
      });
    });

    document.querySelectorAll("[data-notesbg-color-preset]").forEach(function (button) {
      button.addEventListener("click", function () {
        var preset = colorPresets[button.dataset.notesbgColorPreset];
        if (!preset) return;
        Object.keys(preset).forEach(function (fn) {
          setFilterValue(fn, preset[fn]);
        });
        applyFilter();
      });
    });

    document.querySelectorAll("[data-notesbg-size-preset]").forEach(function (button) {
      button.addEventListener("click", function () {
        var raw = button.dataset.notesbgSizePreset;
        applySize(raw === "auto" ? "auto" : Number(raw));
      });
    });

    if (offsetYSlider) {
      offsetYSlider.addEventListener("input", function () {
        if (offsetYNumber) offsetYNumber.value = offsetYSlider.value;
        applyTransform();
      });
    }
    if (offsetYNumber) {
      offsetYNumber.addEventListener("input", function () {
        if (offsetYSlider) offsetYSlider.value = offsetYNumber.value;
        applyTransform();
      });
    }

    if (scaleSlider) {
      scaleSlider.addEventListener("input", function () {
        if (scaleNumber) scaleNumber.value = scaleSlider.value;
        applyTransform();
      });
    }
    if (scaleNumber) {
      scaleNumber.addEventListener("input", function () {
        if (scaleSlider) scaleSlider.value = scaleNumber.value;
        applyTransform();
      });
    }

    if (offsetXSlider) {
      offsetXSlider.addEventListener("input", function () {
        if (offsetXNumber) offsetXNumber.value = offsetXSlider.value;
        applyOffsetX();
      });
    }
    if (offsetXNumber) {
      offsetXNumber.addEventListener("input", function () {
        if (offsetXSlider) offsetXSlider.value = offsetXNumber.value;
        applyOffsetX();
      });
    }

    if (invertButton) {
      invertButton.addEventListener("click", function () {
        inverted = !inverted;
        invertButton.classList.toggle("is-active", inverted);
        applyFilter();
      });
    }

    applyFilter();
    applyTransform();
    applyOffsetX();
  }

/* temporary: sliders for the .notes-shell translucent gray panel
     (gray level + opacity). Remove this function (and the button row in
     notes.html) once values are picked. */
  function initNotesShellTestControls() {
    var shell = document.querySelector(".notes-shell");
    var graySlider = document.querySelector("[data-notesshell-gray-slider]");
    var grayNumber = document.querySelector("[data-notesshell-gray]");
    var opacitySlider = document.querySelector("[data-notesshell-opacity-slider]");
    var opacityNumber = document.querySelector("[data-notesshell-opacity]");
    if (!shell) return;

    function apply() {
      var gray = graySlider ? graySlider.value : 140;
      var opacity = opacitySlider ? Number(opacitySlider.value) / 100 : 0.35;
      shell.style.background =
        "rgba(" + gray + ", " + gray + ", " + gray + ", " + opacity + ")";
    }

    if (graySlider) {
      graySlider.addEventListener("input", function () {
        if (grayNumber) grayNumber.value = graySlider.value;
        apply();
      });
    }
    if (grayNumber) {
      grayNumber.addEventListener("input", function () {
        if (graySlider) graySlider.value = grayNumber.value;
        apply();
      });
    }

    if (opacitySlider) {
      opacitySlider.addEventListener("input", function () {
        if (opacityNumber) opacityNumber.value = opacitySlider.value;
        apply();
      });
    }
    if (opacityNumber) {
      opacityNumber.addEventListener("input", function () {
        if (opacitySlider) opacitySlider.value = opacityNumber.value;
        apply();
      });
    }

    apply();
  }

  /* temporary: master show/hide toggle for every .hue-test panel on the
     Notes page, so they can all be tucked away at once while eyeballing
     the actual design. Remove once all the test panels are removed. */
  function initNotesTestPanelToggle() {
    var panel = document.getElementById("notes-test-panel");
    var toggle = document.querySelector("[data-notes-test-toggle]");
    if (!panel || !toggle) return;

    toggle.addEventListener("click", function () {
      var willHide = !panel.hidden;
      panel.hidden = willHide;
      toggle.textContent = willHide ? "Show Test Controls" : "Hide Test Controls";
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
    initClock();
    initHiddenEgg();
    initBgTestControls();
    initBgImageToggle();
    initFilterTabs();
    initNotesAccordion();
    initNotesBgTestControls();
    initNotesShellTestControls();
    initNotesTestPanelToggle();
    initConsoleGreeting();
  });
})();
