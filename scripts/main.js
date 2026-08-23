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
      stars: "img/stars.gif",
      bricks: "img/bluebrick.jpg",
      vgrid: "img/vgrid.jpg",
    };

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        var src = images[button.dataset.bgImage];
        if (!src) return;
        bg.style.backgroundImage = 'url("' + src + '")';
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
    initClock();
    initHiddenEgg();
    initBgTestControls();
    initBgImageToggle();
    initFilterTabs();
    initConsoleGreeting();
  });
})();
