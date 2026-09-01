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

  /* Shared by Library's category tabs and the sidebar stats' Posts/Thoughts
     filter on Notes. A [data-filter-group] element points at a target list
     via its data-filter-group value (an id selector); clicking a
     [data-filter] button inside it shows/hides the target's children that
     carry the matching data attribute — data-category by default, or
     whatever data-filter-attr on the group names instead (e.g. "kind"). */
  function initFilterTabs() {
    document.querySelectorAll("[data-filter-group]").forEach(function (group) {
      var target = document.querySelector(group.dataset.filterGroup);
      if (!target) return;

      var attr = group.dataset.filterAttr || "category";
      var items = target.querySelectorAll("[data-" + attr + "]");
      var tabs = group.querySelectorAll("[data-filter]");

      function select(tab) {
        tabs.forEach(function (t) {
          t.classList.remove("is-active");
        });
        tab.classList.add("is-active");

        var filter = tab.dataset.filter;
        items.forEach(function (item) {
          item.hidden = filter !== "all" && item.dataset[attr] !== filter;
        });
      }

      tabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
          select(tab);
        });
      });

      // apply whichever tab the markup starts out marking active, so a
      // page whose default isn't "all" actually opens filtered rather
      // than showing everything under a highlighted category tab
      var initial = group.querySelector("[data-filter].is-active");
      if (initial) select(initial);
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

  /* temporary: size/position sliders for the header wordmark images
     (.page-title img on Library/Notes/Projects) — sets CSS custom
     properties on <html> so the same values apply no matter which of
     the three pages you're currently looking at. Remove this function
     (and the slider markup on those three pages) once values are
     picked. */
  function initPageTitleImageTest() {
    var img = document.querySelector(".page-title img");
    var heightSlider = document.querySelector("[data-title-img-height-slider]");
    if (!img || !heightSlider) return;

    var heightNumber = document.querySelector("[data-title-img-height]");
    var xSlider = document.querySelector("[data-title-img-x-slider]");
    var xNumber = document.querySelector("[data-title-img-x]");
    var ySlider = document.querySelector("[data-title-img-y-slider]");
    var yNumber = document.querySelector("[data-title-img-y]");

    function apply() {
      root.style.setProperty("--page-title-img-height", heightSlider.value + "px");
      root.style.setProperty("--page-title-img-x", (xSlider ? xSlider.value : 0) + "px");
      root.style.setProperty("--page-title-img-y", (ySlider ? ySlider.value : 0) + "px");
    }

    heightSlider.addEventListener("input", function () {
      if (heightNumber) heightNumber.value = heightSlider.value;
      apply();
    });
    if (heightNumber) {
      heightNumber.addEventListener("input", function () {
        heightSlider.value = heightNumber.value;
        apply();
      });
    }

    if (xSlider) {
      xSlider.addEventListener("input", function () {
        if (xNumber) xNumber.value = xSlider.value;
        apply();
      });
    }
    if (xNumber) {
      xNumber.addEventListener("input", function () {
        if (xSlider) xSlider.value = xNumber.value;
        apply();
      });
    }

    if (ySlider) {
      ySlider.addEventListener("input", function () {
        if (yNumber) yNumber.value = ySlider.value;
        apply();
      });
    }
    if (yNumber) {
      yNumber.addEventListener("input", function () {
        if (ySlider) ySlider.value = yNumber.value;
        apply();
      });
    }

    apply();
  }

  /* master show/hide toggle for the .page-title-img-test panel, hidden
     by default so it doesn't clutter the page. Remove along with that
     panel once values are picked. */
  function initPageTitleImageTestToggle() {
    var panel = document.getElementById("page-title-img-test-panel");
    var toggle = document.querySelector("[data-title-img-test-toggle]");
    if (!panel || !toggle) return;

    toggle.addEventListener("click", function () {
      var willHide = !panel.hidden;
      panel.hidden = willHide;
      toggle.textContent = willHide ? "Show Test Controls" : "Hide Test Controls";
    });
  }

  /* Notes' quadrant divider lines (see .shell--quadrant in
     components.css) — sized/positioned here rather than in CSS because
     both depend on measurements CSS can't express as a fixed value: the
     sidebar column's rendered width (a minmax() range) and the title
     image's height (a live-adjustable custom property). Both lines are
     single elements measured the same way so they come out the same
     weight, instead of two borders on two different elements that could
     round to different sub-pixel widths and leave a visible seam where
     they're meant to meet. */
  function initQuadrantDividers() {
    var shell = document.querySelector(".shell--quadrant");
    if (!shell) return;

    var sidebar = shell.querySelector(".sidebar-col");
    var mainCol = shell.querySelector(".main-col");
    var header = shell.querySelector(".page-header");
    var vLine = shell.querySelector(".quadrant-divider--v");
    var hLine = shell.querySelector(".quadrant-divider--h");
    var hLeft = shell.querySelector(".quadrant-divider--h-left");
    if (!sidebar || !mainCol || !header || !vLine || !hLine) return;

    var H_Y_ADJUST = 10;
    var V_TOP_ADJUST = 10;
    var V_BOTTOM_ADJUST = -300;

    /* Everything below is measured from the elements' layout boxes
       (offsetTop/offsetLeft/offsetHeight), never from their on-screen
       rects. getBoundingClientRect is relative to the viewport, so
       running this while the page happened to be scrolled — on a resize,
       or on a soft navigation that lands before the scroll position has
       been reset — produced a wildly too-tall line: the shell's own top
       was far above the viewport, and every height measured against it
       came out that much larger. An absolutely-positioned line taller
       than the panel then hangs off the bottom of the document and adds
       real scrollable space below the content, which is what let the
       page keep scrolling long after the last card. The sidebar being
       sticky is the other reason: its rect reports wherever it's
       currently pinned, its layout box doesn't move.

       .sidebar-col and .main-col both take .shell--quadrant as their
       offset parent; .page-header takes .main-col, so its offset has to
       be added onto .main-col's own. */
    var sidebarTop = sidebar.offsetTop;
    var sidebarBottom = sidebarTop + sidebar.offsetHeight;
    var mainTop = mainCol.offsetTop;
    var mainBottom = mainTop + mainCol.offsetHeight;

    var top = Math.min(sidebarTop, mainTop) + V_TOP_ADJUST;
    var bottom = Math.max(sidebarBottom, mainBottom) + V_BOTTOM_ADJUST;
    var left = (sidebar.offsetLeft + sidebar.offsetWidth + mainCol.offsetLeft) / 2;

    // V_BOTTOM_ADJUST is a fixed pull-in, which a short page (Projects,
    // with one entry) would otherwise eat almost all of, leaving a stub
    // instead of a divider. Floor it at the bottom of the nav column —
    // separating the nav from the content is the line's whole job, so it
    // should never stop short of it. Longer pages clear this floor
    // anyway and are unaffected.
    bottom = Math.max(bottom, sidebarBottom);
    // and never past the panel itself, so the line can't add scrollable
    // space below the page no matter what the numbers above come out as
    bottom = Math.min(bottom, shell.clientHeight);

    vLine.style.top = top + "px";
    vLine.style.height = Math.max(0, bottom - top) + "px";
    vLine.style.left = left + "px";

    // the horizontal line's y, in the shell's own coordinates
    var hY = mainTop + header.offsetTop + header.offsetHeight + H_Y_ADJUST;

    // right half: from the vertical line to the end of the article
    // column, scrolling with the page like the rest of the panel
    hLine.style.top = hY + "px";
    hLine.style.left = left + "px";
    hLine.style.width = Math.max(0, mainCol.offsetLeft + mainCol.offsetWidth - left) + "px";

    // left half: a child of the pinned nav column, so it stays with it
    // instead of sliding away. offsetTop/offsetLeft rather than
    // getBoundingClientRect, since those report the column's layout
    // position and so don't change with however far the page happens to
    // be scrolled when this runs.
    if (hLeft) {
      hLeft.style.top = hY - sidebarTop + "px";
      hLeft.style.left = "0px";
      hLeft.style.width = Math.max(0, left - sidebar.offsetLeft) + "px";
    }
  }

  /* Anything that changes how tall the panel is has to re-measure the
     lines, or they keep the length they had before: picking a category
     hides most of the cards, expanding an article adds a body, and both
     left the line hanging past the (now shorter) panel, where it added
     real scrollable space below the page. A category filter is the
     obvious one because it can hide nine cards at once, which is why
     Reviews showed this and All didn't. Watching the panel's box covers
     all of them at once, including anything added later. */
  function initQuadrantDividerWatch() {
    var shell = document.querySelector(".shell--quadrant");
    if (!shell || !window.ResizeObserver || shell.dataset.dividerWatched) return;
    shell.dataset.dividerWatched = "1";
    new ResizeObserver(function () {
      initQuadrantDividers();
    }).observe(shell);
  }

  /* temporary: the FX/border test panels render inside .notes-shell
     (as part of the page's slotted content), and several of the FX
     presets set filter/backdrop-filter/clip-path on .notes-shell itself
     — any of those properties turns the element into a new containing
     block for its position:fixed descendants (part of the CSS spec, not
     a bug), which both breaks the panels' viewport-anchored position
     (frost) and clips them out of view entirely (torn edge). Moving
     them to be direct children of <body> — a sibling of <main>, not a
     descendant — sidesteps this regardless of which preset is active.
     Runs on every astro:page-load since <body> (and everything freshly
     rendered inside it, panels included) is replaced wholesale on each
     navigation, so this never accumulates stale copies. Remove once the
     FX experiment is done and these panels go away entirely. */
  /* temporary: remembers whatever the test panels are currently set to,
     in this browser, so a tuning session survives a refresh, a closed
     tab, or the hot-reload that fires every time the CSS/JS behind the
     panels is edited — without this, every one of those resets each
     control to the default written into notes.astro. Must run before
     the init*() functions that read those controls, since they apply
     whatever value is in the DOM at the time. Remove along with the
     panels themselves. */
  var TUNING_KEY = "thread33-tuning";

  /* the effect toggles and every tuned value are written onto <html>,
     which survives soft navigation — so Writing hands its current look
     to Library/Projects for free, but a hard load of one of those two
     would drop back to the values baked into the CSS and look subtly
     different from the page you'd just been on. Replaying the stored
     property dump on every page keeps all three identical either way.
     Remove along with the panels themselves. */
  function initTuningReplay() {
    try {
      var saved = JSON.parse(window.localStorage.getItem(TUNING_KEY) || "null");
      if (!saved) return;
      if (saved.props) {
        Object.keys(saved.props).forEach(function (name) {
          root.style.setProperty(name, saved.props[name]);
        });
      }
      if (saved.toggles) {
        Object.keys(saved.toggles).forEach(function (key) {
          root.dataset[key] = saved.toggles[key];
        });
      }
    } catch (err) {
      /* private mode, cleared storage, corrupt JSON — fall back to the
         values baked into the CSS */
    }
  }

  function initTuningPersistence() {
    var panels = document.querySelectorAll(".fx-test");
    if (!panels.length) return;

    function fieldKey(el) {
      var keys = Object.keys(el.dataset);
      return keys.length ? keys[0] : null;
    }

    function eachField(fn) {
      panels.forEach(function (panel) {
        panel.querySelectorAll("input, select").forEach(function (el) {
          var key = fieldKey(el);
          if (key) fn(el, key);
        });
      });
    }

    // restore first, so the appliers below see the stored values
    try {
      var saved = JSON.parse(window.localStorage.getItem(TUNING_KEY) || "null");
      if (saved) {
        if (saved.fields) {
          eachField(function (el, key) {
            if (saved.fields[key] !== undefined) el.value = saved.fields[key];
          });
        }
        if (saved.toggles) {
          Object.keys(saved.toggles).forEach(function (key) {
            root.dataset[key] = saved.toggles[key];
          });
        }
      }
    } catch (err) {
      /* private mode, cleared storage, corrupt JSON — fall back to the
         defaults in the markup rather than breaking the panels */
    }

    function save() {
      // start from whatever is already stored — Writing and Library each
      // carry only part of the full field set, so rebuilding from just
      // the panels on this page would drop the other page's values
      var fields = {};
      try {
        var prev = JSON.parse(window.localStorage.getItem(TUNING_KEY) || "null");
        if (prev && prev.fields) fields = prev.fields;
      } catch (err) {
        /* unreadable storage — start clean rather than lose this page's
           values too */
      }
      eachField(function (el, key) {
        fields[key] = el.value;
      });

      var toggles = {};
      Object.keys(root.dataset).forEach(function (key) {
        if (key.indexOf("fx") === 0) toggles[key] = root.dataset[key];
      });

      // the resolved custom properties too, not just the control values
      // they came from — that's all initTuningReplay() needs on a page
      // with no panel to read
      var props = {};
      for (var i = 0; i < root.style.length; i++) {
        var name = root.style[i];
        if (name.indexOf("--") === 0) props[name] = root.style.getPropertyValue(name);
      }

      try {
        window.localStorage.setItem(
          TUNING_KEY,
          JSON.stringify({ fields: fields, toggles: toggles, props: props })
        );
      } catch (err) {
        /* nothing to do if storage is unavailable — tuning still works,
           it just won't survive a reload */
      }
    }

    panels.forEach(function (panel) {
      panel.addEventListener("input", save);
      panel.addEventListener("change", save);
      // the effect toggles write root.dataset in their own click handler,
      // so read it back on the next tick rather than mid-click
      panel.addEventListener("click", function (event) {
        if (event.target.closest("[data-fx-toggle]")) setTimeout(save, 0);
      });
    });
  }

  function initTestPanelsToBody() {
    // the toggle button rides along for the same reason the panels do —
    // it's position: fixed, and the .main-col it's authored in sits under
    // ancestors carrying filter/backdrop-filter, which would make one of
    // them its containing block and clip it
    ["fx-test-panel", "sleep-anim-test-panel", "fx-test-toggle"].forEach(function (id) {
      var panel = document.getElementById(id);
      if (panel && panel.parentElement !== document.body) {
        document.body.appendChild(panel);
      }
    });
  }

  /* temporary: one button in the bottom-left corner that shows/hides both
     test panels at once. Deliberately not persisted like the slider
     values are — the panels start collapsed on every load, so the page
     can be judged on its own before opening them. Remove along with the
     panels themselves. */
  /* Library's sidebar portrait: 007 (looking away) at rest, click to
     turn her front-on (015) for --portrait-hold, then she turns back and
     stays unclickable for a further --portrait-cooldown. Clicks during
     either stretch do nothing at all. */
  function initNavPortrait() {
    var portrait = document.querySelector(".nav-portrait");
    if (!portrait) return;

    function ms(name, fallback) {
      var raw = parseFloat(getComputedStyle(root).getPropertyValue(name));
      return isNaN(raw) ? fallback : raw;
    }

    /* Both drawings sit in the middle of a mostly-transparent square, so
       hit-testing the element's box would light the cursor up over a lot
       of empty space. Each is drawn once into an offscreen canvas so the
       alpha at the cursor can be read back, and the element only accepts
       the pointer where that alpha is non-zero. */
    var masks = {};
    var ALPHA_MIN = 20;

    function loadMask(name, src) {
      var img = new Image();
      img.addEventListener("load", function () {
        try {
          var canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          var ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          masks[name] = {
            data: ctx.getImageData(0, 0, canvas.width, canvas.height).data,
            w: canvas.width,
            h: canvas.height,
          };
        } catch (err) {
          // no readback available — fall back to the whole box being live
          portrait.style.pointerEvents = "auto";
        }
      });
      img.addEventListener("error", function () {
        portrait.style.pointerEvents = "auto";
      });
      img.src = src;
    }

    loadMask("back", "/img/portraits/ch00202_007.png");
    loadMask("front", "/img/portraits/ch00202_015.png");

    function isOverDrawing(event) {
      var mask = masks[portrait.classList.contains("is-front") ? "front" : "back"];
      if (!mask) return false;

      var rect = portrait.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX >= rect.right ||
        event.clientY < rect.top ||
        event.clientY >= rect.bottom
      ) {
        return false;
      }

      // the drawing is stretched to fill the box, so box coords map
      // straight onto source pixels
      var x = Math.floor(((event.clientX - rect.left) / rect.width) * mask.w);
      var y = Math.floor(((event.clientY - rect.top) / rect.height) * mask.h);
      return mask.data[(y * mask.w + x) * 4 + 3] > ALPHA_MIN;
    }

    document.addEventListener("mousemove", function (event) {
      portrait.style.pointerEvents = isOverDrawing(event) ? "auto" : "none";
    });

    // the sheet's second row, read as four two-frame loops — the number
    // is the column its first frame sits in
    var EMOTE_COLS = [0, 2, 4, 6];
    // she only ever hums to herself in the first two (note and heart);
    // the cross-eyes and the scribble are reserved for being clicked, so
    // the two kinds of reaction stay tellable apart
    var IDLE_COLS = [0, 2];
    var emote = document.querySelector(".nav-emote");

    function showEmote(cols) {
      if (!emote) return;
      emote.style.setProperty("--emote-col", cols[Math.floor(Math.random() * cols.length)]);
      emote.classList.add("is-visible");
    }

    function hideEmote() {
      if (emote) emote.classList.remove("is-visible");
    }

    var busy = false;
    var idleTimer;
    var idleHideTimer;

    /* She pipes up on her own every --emote-idle-min to --emote-idle-max,
       for as long as she'd stay turned around if you'd clicked her. The
       countdown is torn down and restarted from scratch the moment she's
       clicked, and only starts again once she's turned back — so a click
       always resets the wait rather than leaving a stray one queued up
       right behind it. */
    function scheduleIdle() {
      clearTimeout(idleTimer);
      var min = ms("--emote-idle-min", 8000);
      var max = ms("--emote-idle-max", 20000);
      if (max < min) max = min;

      idleTimer = setTimeout(function () {
        // the page this was scheduled on is gone (soft navigation
        // replaces the whole body) — let the chain end rather than tick
        // on forever against a detached element
        if (!portrait.isConnected) return;
        showEmote(IDLE_COLS);
        idleHideTimer = setTimeout(function () {
          hideEmote();
          scheduleIdle();
        }, ms("--portrait-hold", 2000));
      }, min + Math.random() * (max - min));
    }

    scheduleIdle();

    portrait.addEventListener("click", function () {
      // clicking through an emote she brought up herself is fine — it
      // just gets replaced. Only the stretch where she's actually turned
      // around, and the cooldown after it, ignore the click.
      if (busy) return;
      busy = true;

      clearTimeout(idleTimer);
      clearTimeout(idleHideTimer);

      portrait.classList.add("is-front");
      showEmote(EMOTE_COLS);

      setTimeout(function () {
        portrait.classList.remove("is-front");
        hideEmote();
        // back to resting, so the wait starts over from here
        scheduleIdle();
        setTimeout(function () {
          busy = false;
        }, ms("--portrait-cooldown", 2000));
      }, ms("--portrait-hold", 2000));
    });
  }

  function initFxTestToggle() {
    var button = document.getElementById("fx-test-toggle");
    if (!button) return;

    var panels = ["fx-test-panel", "sleep-anim-test-panel"]
      .map(function (id) {
        return document.getElementById(id);
      })
      .filter(Boolean);
    if (!panels.length) return;

    function apply(open) {
      panels.forEach(function (panel) {
        panel.hidden = !open;
      });
      button.textContent = open ? "收起测试按钮" : "展开测试按钮";
    }

    apply(false);

    button.addEventListener("click", function () {
      apply(panels[0].hidden);
    });
  }

  /* temporary: dumps every value the test panels have set into a
     textarea, so a tuning session's result can be copied out in one
     piece instead of read slider by slider. Everything the sliders
     touch is written as a custom property on <html>, so reading
     root.style back gives the full picture; the on/off effect toggles
     live in root.dataset and the noise grain density is the one value
     that ends up inside an SVG data URI rather than a property, so both
     are appended separately. Remove along with the panels themselves. */
  function initSettingsExport() {
    var button = document.querySelector("[data-settings-export]");
    var output = document.getElementById("settings-export-output");
    if (!button || !output) return;

    button.addEventListener("click", function () {
      var props = [];
      for (var i = 0; i < root.style.length; i++) {
        var name = root.style[i];
        if (name.indexOf("--") !== 0) continue;
        props.push(name + ": " + root.style.getPropertyValue(name).trim() + ";");
      }
      props.sort();

      var toggles = [];
      Object.keys(root.dataset).forEach(function (key) {
        if (key.indexOf("fx") === 0) toggles.push(key + " = " + root.dataset[key]);
      });
      toggles.sort();

      var extras = [];
      var freq = document.querySelector("[data-noise-freq-slider]");
      if (freq) extras.push("noise baseFrequency = " + Number(freq.value) / 100);

      output.value = props
        .concat(toggles.length ? ["", "/* toggles */"].concat(toggles) : [])
        .concat(extras.length ? ["", "/* extras */"].concat(extras) : [])
        .join("\n");
      output.hidden = false;
      output.select();
    });
  }

  /* temporary: color/opacity/radius/border/shadow controls for
     .notes-shell itself — the translucent panel the .fx-layer stack
     sits on top of, as opposed to those overlays. All of them are plain
     custom properties read in components.css, so this is just a generic
     slider→property binder. Remove this function (and the 面板* groups
     in notes.astro) once values are picked. */
  function initPanelTest() {
    // any tuning panel will do — each page carries whichever subset of
    // the fields below it actually has controls for, and apply() skips
    // the rest
    if (!document.querySelector(".fx-test")) return;

    var fields = [
      { key: "panel-r", cssVar: "--panel-r" },
      { key: "panel-g", cssVar: "--panel-g" },
      { key: "panel-b", cssVar: "--panel-b" },
      { key: "panel-a", cssVar: "--panel-a", isAlpha: true },
      { key: "panel-radius", cssVar: "--panel-radius", unit: "px" },
      { key: "panel-border-r", cssVar: "--panel-border-r" },
      { key: "panel-border-g", cssVar: "--panel-border-g" },
      { key: "panel-border-b", cssVar: "--panel-border-b" },
      { key: "panel-border-a", cssVar: "--panel-border-a", isAlpha: true },
      { key: "panel-border-w", cssVar: "--panel-border-w", unit: "px" },
      { key: "panel-shadow-r", cssVar: "--panel-shadow-r" },
      { key: "panel-shadow-g", cssVar: "--panel-shadow-g" },
      { key: "panel-shadow-b", cssVar: "--panel-shadow-b" },
      { key: "panel-shadow-a", cssVar: "--panel-shadow-a", isAlpha: true },
      { key: "panel-shadow-x", cssVar: "--panel-shadow-x", unit: "px" },
      { key: "panel-shadow-y", cssVar: "--panel-shadow-y", unit: "px" },
      { key: "panel-shadow-blur", cssVar: "--panel-shadow-blur", unit: "px" },
      { key: "panel-shadow-spread", cssVar: "--panel-shadow-spread", unit: "px" },
      // .notes-row's frame and rounding
      { key: "blog-border-r", cssVar: "--blog-border-r" },
      { key: "blog-border-g", cssVar: "--blog-border-g" },
      { key: "blog-border-b", cssVar: "--blog-border-b" },
      { key: "blog-border-a", cssVar: "--blog-border-a", isAlpha: true },
      { key: "blog-border-w", cssVar: "--blog-border-w", unit: "px" },
      { key: "blog-radius", cssVar: "--blog-radius", unit: "px" },
      // .home-nav-vertical__link's fill
      { key: "nav-bg-r", cssVar: "--nav-bg-r" },
      { key: "nav-bg-g", cssVar: "--nav-bg-g" },
      { key: "nav-bg-b", cssVar: "--nav-bg-b" },
      { key: "nav-bg-a", cssVar: "--nav-bg-a", isAlpha: true },
      // .home-nav-vertical__link's frame and rounding
      { key: "nav-border-r", cssVar: "--nav-border-r" },
      { key: "nav-border-g", cssVar: "--nav-border-g" },
      { key: "nav-border-b", cssVar: "--nav-border-b" },
      { key: "nav-border-a", cssVar: "--nav-border-a", isAlpha: true },
      { key: "nav-border-w", cssVar: "--nav-border-w", unit: "px" },
      { key: "nav-radius", cssVar: "--nav-radius", unit: "px" },
      // a Micro entry's own frame and rounding
      { key: "micro-border-r", cssVar: "--micro-border-r" },
      { key: "micro-border-g", cssVar: "--micro-border-g" },
      { key: "micro-border-b", cssVar: "--micro-border-b" },
      { key: "micro-border-a", cssVar: "--micro-border-a", isAlpha: true },
      { key: "micro-border-w", cssVar: "--micro-border-w", unit: "px" },
      { key: "micro-radius", cssVar: "--micro-radius", unit: "px" },
      // the avatar thumbnails' shared filter chain
      { key: "avatar-grayscale", cssVar: "--avatar-grayscale", unit: "%" },
      { key: "avatar-brightness", cssVar: "--avatar-brightness", unit: "%" },
      { key: "avatar-contrast", cssVar: "--avatar-contrast", unit: "%" },
      { key: "avatar-saturate", cssVar: "--avatar-saturate", unit: "%" },
      { key: "avatar-hue", cssVar: "--avatar-hue", unit: "deg" },
      { key: "avatar-sepia", cssVar: "--avatar-sepia", unit: "%" },
      // the vignette layer's color and how far out its clear center runs
      { key: "vignette-r", cssVar: "--vignette-r" },
      { key: "vignette-g", cssVar: "--vignette-g" },
      { key: "vignette-b", cssVar: "--vignette-b" },
      { key: "vignette-a", cssVar: "--vignette-a", isAlpha: true },
      { key: "vignette-start", cssVar: "--vignette-start", unit: "%" },
      // the frost layer's backdrop-filter functions
      { key: "frost-blur", cssVar: "--frost-blur", unit: "px" },
      { key: "frost-brightness", cssVar: "--frost-brightness", unit: "%" },
      { key: "frost-contrast", cssVar: "--frost-contrast", unit: "%" },
      { key: "frost-saturate", cssVar: "--frost-saturate", unit: "%" },
      // the page's wordmark image. Height also feeds .sidebar-col--titled's
      // push-down and sticky offset, so the nav follows it automatically.
      { key: "page-title-h", cssVar: "--page-title-img-height", unit: "px" },
      { key: "page-title-x", cssVar: "--page-title-img-x", unit: "px" },
      { key: "page-title-y", cssVar: "--page-title-img-y", unit: "px" },
      // the sidebar's two-frame pixel sprite — same binder, different target
      { key: "sleep-scale", cssVar: "--sleep-scale" },
      { key: "sleep-x", cssVar: "--sleep-x", unit: "px" },
      { key: "sleep-y", cssVar: "--sleep-y", unit: "px" },
      { key: "sleep-speed", cssVar: "--sleep-speed", unit: "ms" },
      { key: "sleep-grayscale", cssVar: "--sleep-grayscale", unit: "%" },
      { key: "sleep-brightness", cssVar: "--sleep-brightness", unit: "%" },
      { key: "sleep-contrast", cssVar: "--sleep-contrast", unit: "%" },
      { key: "sleep-saturate", cssVar: "--sleep-saturate", unit: "%" },
      { key: "sleep-hue", cssVar: "--sleep-hue", unit: "deg" },
      { key: "sleep-sepia", cssVar: "--sleep-sepia", unit: "%" },
      { key: "sleep-a", cssVar: "--sleep-a", isAlpha: true },
      // Library's sidebar portrait — hold/cooldown are read back out of
      // these by initNavPortrait() rather than used by CSS directly
      { key: "portrait-size", cssVar: "--portrait-size", unit: "px" },
      { key: "portrait-x", cssVar: "--portrait-x", unit: "px" },
      { key: "portrait-y", cssVar: "--portrait-y", unit: "px" },
      { key: "portrait-hold", cssVar: "--portrait-hold", unit: "ms" },
      { key: "portrait-cooldown", cssVar: "--portrait-cooldown", unit: "ms" },
      { key: "portrait-grayscale", cssVar: "--portrait-grayscale", unit: "%" },
      { key: "portrait-brightness", cssVar: "--portrait-brightness", unit: "%" },
      { key: "portrait-contrast", cssVar: "--portrait-contrast", unit: "%" },
      { key: "portrait-saturate", cssVar: "--portrait-saturate", unit: "%" },
      { key: "portrait-hue", cssVar: "--portrait-hue", unit: "deg" },
      { key: "portrait-sepia", cssVar: "--portrait-sepia", unit: "%" },
      { key: "portrait-a", cssVar: "--portrait-a", isAlpha: true },
      { key: "portrait-outline-w", cssVar: "--portrait-outline-w", unit: "px" },
      { key: "portrait-outline-r", cssVar: "--portrait-outline-r" },
      { key: "portrait-outline-g", cssVar: "--portrait-outline-g" },
      { key: "portrait-outline-b", cssVar: "--portrait-outline-b" },
      { key: "portrait-outline-a", cssVar: "--portrait-outline-a", isAlpha: true },
      { key: "emote-size", cssVar: "--emote-size", unit: "px" },
      { key: "emote-speed", cssVar: "--emote-speed", unit: "ms" },
      { key: "emote-idle-min", cssVar: "--emote-idle-min", unit: "ms" },
      { key: "emote-idle-max", cssVar: "--emote-idle-max", unit: "ms" },
      { key: "emote-x", cssVar: "--emote-x", unit: "px" },
      { key: "emote-y", cssVar: "--emote-y", unit: "px" },
    ];

    function apply() {
      fields.forEach(function (field) {
        var slider = document.querySelector("[data-" + field.key + "-slider]");
        if (!slider) return;
        var value = field.isAlpha ? Number(slider.value) / 100 : slider.value + (field.unit || "");
        root.style.setProperty(field.cssVar, value);
      });
    }

    fields.forEach(function (field) {
      var slider = document.querySelector("[data-" + field.key + "-slider]");
      var number = document.querySelector("[data-" + field.key + "]");
      if (!slider) return;

      slider.addEventListener("input", function () {
        if (number) number.value = slider.value;
        apply();
      });
      if (number) {
        number.addEventListener("input", function () {
          slider.value = number.value;
          apply();
        });
      }
    });

    apply();
  }

  /* temporary: opacity/density/tile-size/blend controls for the Noise
     background layer. Opacity, size and blend are plain custom
     properties, but grain density is feTurbulence's baseFrequency —
     that lives inside the SVG data URI, so the whole background-image
     has to be rebuilt here rather than varied from CSS. Remove this
     function (and the 噪点参数 group in notes.astro) once values are
     picked, along with the layer itself if it's not kept. */
  function initNoiseTest() {
    var layer = document.querySelector(".fx-layer--noise");
    var freqSlider = document.querySelector("[data-noise-freq-slider]");
    if (!layer || !freqSlider) return;

    var opacitySlider = document.querySelector("[data-noise-opacity-slider]");
    var opacityNumber = document.querySelector("[data-noise-opacity]");
    var freqNumber = document.querySelector("[data-noise-freq]");
    var sizeSlider = document.querySelector("[data-noise-size-slider]");
    var sizeNumber = document.querySelector("[data-noise-size]");
    var blendSelect = document.querySelector("[data-noise-blend]");

    function apply() {
      if (opacitySlider) {
        root.style.setProperty("--noise-opacity", Number(opacitySlider.value) / 100);
      }
      if (sizeSlider) {
        root.style.setProperty("--noise-size", sizeSlider.value + "px");
      }
      if (blendSelect) {
        root.style.setProperty("--noise-blend", blendSelect.value);
      }

      // slider is 1-200 for a usable range of steps; baseFrequency itself
      // is a 0-2 decimal, hence the /100
      var freq = Number(freqSlider.value) / 100;
      layer.style.backgroundImage =
        "url(\"data:image/svg+xml;utf8," +
        "<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'>" +
        "<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='" +
        freq +
        "' numOctaves='2' stitchTiles='stitch'/></filter>" +
        "<rect width='100' height='100' filter='url(%23n)'/></svg>\")";
    }

    [
      [opacitySlider, opacityNumber],
      [freqSlider, freqNumber],
      [sizeSlider, sizeNumber],
    ].forEach(function (pair) {
      var slider = pair[0];
      var number = pair[1];
      if (slider) {
        slider.addEventListener("input", function () {
          if (number) number.value = slider.value;
          apply();
        });
      }
      if (number) {
        number.addEventListener("input", function () {
          if (slider) slider.value = number.value;
          apply();
        });
      }
    });

    if (blendSelect) blendSelect.addEventListener("change", apply);

    apply();
  }

  /* temporary: angle/start-color/end-color/opacity sliders for the
     Gradient background preset, setting the custom properties
     .notes-shell[data-bg-effect="gradient"] reads in components.css.
     Remove this function (and the Gradient group in notes.astro) once
     values are picked, along with the preset itself if it's not kept. */
  function initGradientTest() {
    var posSlider = document.querySelector("[data-gradient-pos-slider]");
    if (!posSlider) return;

    var fields = [
      { key: "pos", cssVar: "--gradient-pos", unit: "%" },
      { key: "start-r", cssVar: "--gradient-start-r" },
      { key: "start-g", cssVar: "--gradient-start-g" },
      { key: "start-b", cssVar: "--gradient-start-b" },
      { key: "end-r", cssVar: "--gradient-end-r" },
      { key: "end-g", cssVar: "--gradient-end-g" },
      { key: "end-b", cssVar: "--gradient-end-b" },
      { key: "start-a", cssVar: "--gradient-start-a", isAlpha: true },
      { key: "end-a", cssVar: "--gradient-end-a", isAlpha: true },
    ];

    function apply() {
      fields.forEach(function (field) {
        var slider = document.querySelector("[data-gradient-" + field.key + "-slider]");
        if (!slider) return;
        var value = field.isAlpha ? Number(slider.value) / 100 : slider.value + (field.unit || "");
        root.style.setProperty(field.cssVar, value);
      });
    }

    fields.forEach(function (field) {
      var slider = document.querySelector("[data-gradient-" + field.key + "-slider]");
      var number = document.querySelector("[data-gradient-" + field.key + "]");
      if (!slider) return;

      slider.addEventListener("input", function () {
        if (number) number.value = slider.value;
        apply();
      });
      if (number) {
        number.addEventListener("input", function () {
          slider.value = number.value;
          apply();
        });
      }
    });

    apply();
  }

  /* temporary: flips independent on/off decoration toggles (data-fx-*
     on <html>, so state survives Astro's soft-navigation body swap the
     same way as everything else in initPersistentBackground()). Each
     one maps to its own .fx-layer or CSS rule in components.css — being
     separate attributes (not one shared "pick one" value) is what lets
     any combination run at once. Remove this function (and the button
     rows in notes.astro) once values are picked. */
  /* which effect layers a page starts with. Lives out here rather than
     inside initFxTest because Library and Projects show the same layers
     as Writing but carry no test panel — without this they'd render with
     every layer off on a hard load, then silently switch on the moment
     you soft-navigated over from Writing (the flags live on <html>,
     which survives navigation). Bake these in and delete along with the
     panels. */
  var FX_DEFAULT_ON = ["frost", "gradient", "vignette", "divider"];

  function fxAttr(key) {
    // "text-glow" -> "fxTextGlow" (the dataset property for data-fx-text-glow)
    return ("fx-" + key).replace(/-([a-z])/g, function (_, c) {
      return c.toUpperCase();
    });
  }

  function initFxDefaults() {
    FX_DEFAULT_ON.forEach(function (key) {
      var attr = fxAttr(key);
      if (root.dataset[attr] === undefined) root.dataset[attr] = "on";
    });
  }

  function initFxTest() {
    var toggles = document.querySelectorAll("[data-fx-toggle]");
    if (!toggles.length) return;

    var labels = {
      frost: "毛玻璃",
      vignette: "暗角",
      noise: "噪点",
      scanlines: "扫描线",
      gradient: "渐变",
      "text-glow": "标题发光",
      "torn-edge": "撕纸边缘",
      divider: "分割线",
    };
    toggles.forEach(function (button) {
      var key = button.dataset.fxToggle;
      var label = labels[key] || key;
      var attr = fxAttr(key);

      // <html> keeps this state across soft navigation even though the
      // button itself is a fresh element each time — sync its label to
      // whatever's already set instead of always starting at "关"
      button.textContent = label + "：" + (root.dataset[attr] === "on" ? "开" : "关");

      button.addEventListener("click", function () {
        var isOn = root.dataset[attr] === "on";
        root.dataset[attr] = isOn ? "off" : "on";
        button.textContent = label + "：" + (isOn ? "关" : "开");
      });
    });
  }

  /* temporary: switches #notes-list's data-micro-style attribute between
     the default Micro entry width and the "Narrow" treatment — the
     matching CSS lives in components.css. Remove this function (and the
     button row in notes.astro) once one is picked. */
  function initNotesMicroStyleTest() {
    var list = document.getElementById("notes-list");
    var buttons = document.querySelectorAll("[data-micro-style-preset]");
    if (!list || !buttons.length) return;

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        buttons.forEach(function (b) {
          b.classList.remove("is-active");
        });
        button.classList.add("is-active");

        var preset = button.dataset.microStylePreset;
        if (preset) {
          list.setAttribute("data-micro-style", preset);
        } else {
          list.removeAttribute("data-micro-style");
        }
      });
    });
  }

  /* temporary: R/G/B/opacity sliders for a Micro entry's background
     color, setting the four custom properties .notes-micro-item reads
     in components.css. Remove this function (and the slider row in
     notes.astro) once values are picked. */
  function initNotesMicroBgTest() {
    var rSlider = document.querySelector("[data-micro-bg-r-slider]");
    if (!rSlider) return;

    var channels = [
      { key: "r", cssVar: "--micro-bg-r" },
      { key: "g", cssVar: "--micro-bg-g" },
      { key: "b", cssVar: "--micro-bg-b" },
    ];

    function apply() {
      channels.forEach(function (channel) {
        var slider = document.querySelector("[data-micro-bg-" + channel.key + "-slider]");
        if (slider) root.style.setProperty(channel.cssVar, slider.value);
      });
      var aSlider = document.querySelector("[data-micro-bg-a-slider]");
      if (aSlider) root.style.setProperty("--micro-bg-a", Number(aSlider.value) / 100);
    }

    channels.concat([{ key: "a" }]).forEach(function (channel) {
      var slider = document.querySelector("[data-micro-bg-" + channel.key + "-slider]");
      var number = document.querySelector("[data-micro-bg-" + channel.key + "]");
      if (!slider) return;

      slider.addEventListener("input", function () {
        if (number) number.value = slider.value;
        apply();
      });
      if (number) {
        number.addEventListener("input", function () {
          slider.value = number.value;
          apply();
        });
      }
    });

    apply();
  }

  /* Accordion rows: clicking a [data-notes-toggle] trigger toggles its
     matching #id panel open/closed in place. Originally built for Notes'
     article list, reused as-is for Library's review rows since the
     mechanism doesn't care what the trigger/panel actually contain. */
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

  /* The [data-notes-collapse] button inside an expanded .notes-expand
     always collapses (never toggles open) — unlike initNotesAccordion's
     triggers, it only ever exists while its panel is already visible.
     Also resyncs the row's aria-expanded, since that's what the
     collapsed-state CSS (e.g. hiding the bobbing arrow) keys off of. */
  function initNotesCollapseButtons() {
    var buttons = document.querySelectorAll("[data-notes-collapse]");
    if (!buttons.length) return;

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        var expand = button.closest(".notes-expand");
        if (!expand) return;
        expand.hidden = true;

        var item = expand.closest(".notes-item");
        var trigger = item && item.querySelector("[data-notes-toggle]");
        if (trigger) trigger.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* Project rows open their detail as a floating modal instead of
     expanding in place — a native <dialog>, shown with showModal() so
     the browser handles focus-trapping, the ::backdrop and Esc-to-close
     without any of that needing to be hand-rolled here. */
  function initProjectModals() {
    var triggers = document.querySelectorAll("[data-project-open]");
    if (!triggers.length) return;

    function open(trigger) {
      var dialog = document.getElementById(trigger.dataset.projectOpen);
      if (!dialog || typeof dialog.showModal !== "function") return;
      dialog.showModal();
      /* showModal() auto-focuses the first focusable descendant — with
         no close button left, that's whatever link happens to be
         furthest down in the write-up, and the browser scrolls it into
         view, opening the dialog already scrolled to the bottom.
         Focusing the dialog itself instead (it's given tabindex="-1" in
         the markup so it CAN take focus without joining the tab order)
         keeps the initial scroll position at the top. */
      dialog.focus();
      dialog.scrollTop = 0;
    }

    triggers.forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        open(trigger);
      });

      trigger.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open(trigger);
        }
      });
    });

    document.querySelectorAll(".project-modal").forEach(function (dialog) {
      // click on the ::backdrop itself (not any of the dialog's content)
      // closes it — Esc already closes a <dialog> natively, so between
      // the two there's no separate close button to wire up
      dialog.addEventListener("click", function (event) {
        if (event.target === dialog) dialog.close();
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

  // the divider lines are sized from measured geometry, so a resized
  // window leaves them the wrong length until something re-measures.
  // Registered once here rather than per page-load so soft navigation
  // doesn't stack up duplicate listeners; the function is a no-op on
  // pages that don't draw the lines.
  var dividerResizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(dividerResizeTimer);
    dividerResizeTimer = setTimeout(initQuadrantDividers, 100);
  });

  // astro:page-load fires after the initial load AND after every
  // subsequent soft navigation (DOMContentLoaded only ever saw the
  // former) — everything that depends on page-specific DOM must re-run
  // here so it rebinds to whatever just got swapped in
  document.addEventListener("astro:page-load", function () {
    initClock();
    initBgTestControls();
    initBgImageToggle();
    initPageTitleImageTest();
    initPageTitleImageTestToggle();
    initTestPanelsToBody();
    // both must precede the appliers below — they read whatever is in the
    // controls at the time, so the stored values have to be in place first
    initFxDefaults();
    initTuningReplay();
    initTuningPersistence();
    initFxTest();
    initGradientTest();
    initNoiseTest();
    initPanelTest();
    initSettingsExport();
    // last of the panel wiring, so it hides panels the appliers above
    // have already read their starting values out of
    initFxTestToggle();
    initNavPortrait();
    initFilterTabs();
    // after the appliers and after the filter, since both change the
    // panel's own box — the appliers via radius/frame width, the filter
    // by hiding most of the cards
    initQuadrantDividers();
    initQuadrantDividerWatch();
    initNotesAccordion();
    initNotesMicroStyleTest();
    initNotesMicroBgTest();
    initNotesCollapseButtons();
    initProjectModals();
    syncPersistentBackground();
  });
})();
