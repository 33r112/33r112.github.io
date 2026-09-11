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
    /* .sidebar-col is sticky, and a sticky element reports its *pinned*
       offset once the page has scrolled — not the layout position it
       would sit at. Refreshing while scrolled to the bottom restores the
       scroll before this runs, so the column measured as far down the
       panel as it was pinned, and the left-hand line went with it.
       Dropping sticky for the length of the measurement gives the layout
       position no matter where the page happens to sit; it's put back
       before anything paints, so nothing moves on screen. */
    var stickyBefore = sidebar.style.position;
    sidebar.style.position = "static";
    var sidebarTop = sidebar.offsetTop;
    var sidebarHeight = sidebar.offsetHeight;
    var sidebarLeft = sidebar.offsetLeft;
    var sidebarWidth = sidebar.offsetWidth;
    sidebar.style.position = stickyBefore;

    var sidebarBottom = sidebarTop + sidebarHeight;
    var mainTop = mainCol.offsetTop;
    var mainBottom = mainTop + mainCol.offsetHeight;

    var top = Math.min(sidebarTop, mainTop) + V_TOP_ADJUST;
    var bottom = Math.max(sidebarBottom, mainBottom) + V_BOTTOM_ADJUST;
    var left = (sidebarLeft + sidebarWidth + mainCol.offsetLeft) / 2;

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
    // instead of sliding away — measured against the column's layout top
    // (see the sticky note above), not wherever it's currently pinned.
    if (hLeft) {
      hLeft.style.top = hY - sidebarTop + "px";
      hLeft.style.left = "0px";
      hLeft.style.width = Math.max(0, left - sidebarLeft) + "px";
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
      initKisekiSplit();
    }).observe(shell);
  }

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

  /* Other's grid: cards only show a cover + title; clicking one clones
     that card's <template> into whichever "slot" spans the full row it
     belongs to (one slot per GRID_COLUMNS cards, see library.astro),
     and points the slot's arrow back up at the card that opened it.
     Games' row list stays on the generic accordion in initNotesAccordion
     — this is a second, independent mechanism only for the grid. */
  function initLibraryGrid() {
    var grid = document.getElementById("library-grid");
    if (!grid) return;

    var cards = Array.prototype.slice.call(grid.querySelectorAll("[data-grid-card]"));
    var slots = Array.prototype.slice.call(grid.querySelectorAll(".library-grid-slot"));
    var GRID_COLUMNS = 4;

    function slotFor(cardIndex) {
      return slots[Math.floor(cardIndex / GRID_COLUMNS)];
    }

    function rowCards(cardIndex) {
      var row = Math.floor(cardIndex / GRID_COLUMNS);
      return cards.filter(function (_, i) {
        return Math.floor(i / GRID_COLUMNS) === row;
      });
    }

    function closeSlot(slot, cardsInRow) {
      slot.hidden = true;
      slot.dataset.openId = "";
      slot.querySelector(".library-grid-slot-content").innerHTML = "";
      cardsInRow.forEach(function (c) {
        c.setAttribute("aria-expanded", "false");
      });
    }

    cards.forEach(function (card, i) {
      card.addEventListener("click", function () {
        var slot = slotFor(i);
        var siblings = rowCards(i);
        var id = card.dataset.gridCard;

        if (slot.dataset.openId === id && !slot.hidden) {
          closeSlot(slot, siblings);
          return;
        }

        var template = grid.querySelector('template[data-grid-detail="' + id + '"]');
        var content = slot.querySelector(".library-grid-slot-content");
        content.innerHTML = "";
        if (template) content.appendChild(template.content.cloneNode(true));

        slot.dataset.openId = id;
        slot.hidden = false;
        siblings.forEach(function (c) {
          c.setAttribute("aria-expanded", String(c === card));
        });

        var cardRect = card.getBoundingClientRect();
        var slotRect = slot.getBoundingClientRect();
        var arrow = slot.querySelector(".library-grid-arrow");
        arrow.style.setProperty(
          "--arrow-left",
          cardRect.left - slotRect.left + cardRect.width / 2 + "px"
        );
      });
    });

    slots.forEach(function (slot) {
      var collapse = slot.querySelector("[data-grid-collapse]");
      if (!collapse) return;
      collapse.addEventListener("click", function () {
        var row = slots.indexOf(slot);
        closeSlot(
          slot,
          cards.filter(function (_, i) {
            return Math.floor(i / GRID_COLUMNS) === row;
          })
        );
      });
    });

    // Games/Other tabs show one list or the other, entirely separate
    // containers rather than one filtered list — see library.astro
    var list = document.getElementById("library-list");
    document.querySelectorAll("[data-filter]").forEach(function (tab) {
      tab.addEventListener("click", function () {
        var showOther = tab.dataset.filter === "other";
        grid.hidden = !showOther;
        if (list) list.hidden = showOther;
      });
    });
  }

  /* temporary: width preset buttons for CBZRebinder's cover thumbnail
     and inline screenshot (see #project-size-test in projects.astro).
     Each group is independent and just writes its own custom property
     onto <html>. Remove this function (and the panel) once sizes are
     picked. */
  function initProjectSizeTest() {
    var panel = document.getElementById("project-size-test");
    if (!panel) return;

    [
      { attr: "projectCoverW", cssVar: "--project-cover-w", defaultValue: "160px" },
      { attr: "projectShotW", cssVar: "--project-shot-w", defaultValue: "100%" },
      { attr: "projectShotBrightness", cssVar: "--project-shot-brightness", defaultValue: "100%" },
    ].forEach(function (group) {
      var buttons = Array.prototype.slice.call(
        panel.querySelectorAll("[data-" + group.cssVar.slice(2) + "]")
      );
      if (!buttons.length) return;

      function paint() {
        var current = root.style.getPropertyValue(group.cssVar) || group.defaultValue;
        buttons.forEach(function (button) {
          button.classList.toggle("is-active", current === button.dataset[group.attr]);
        });
      }

      buttons.forEach(function (button) {
        button.addEventListener("click", function () {
          root.style.setProperty(group.cssVar, button.dataset[group.attr]);
          paint();
        });
      });
      paint();
    });
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

  /* The [data-notes-collapse] button inside an expanded panel (Notes'
     .notes-expand, or Library's reuse of the same mechanism as
     .library-expand) always collapses (never toggles open) — unlike
     initNotesAccordion's triggers, it only ever exists while its panel
     is already visible. Also resyncs the row's aria-expanded, since
     that's what the collapsed-state CSS (e.g. hiding the bobbing arrow)
     keys off of. */
  function initNotesCollapseButtons() {
    var buttons = document.querySelectorAll("[data-notes-collapse]");
    if (!buttons.length) return;

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        var expand = button.closest(".notes-expand, .library-expand");
        if (!expand) return;
        expand.hidden = true;

        var item = expand.closest(".notes-item, .library-item");
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

    // the station illustration on Reviews is drawn in two pieces, one
    // either side of the content panel — see initKisekiSplit()
    // pictures first, then the colour blocks — a block has to paint over
    // the picture, and same-stacking siblings paint in DOM order
    // the middle deliberately gets no colour block — the sky is meant to
    // show right up to the top there
    // mid before left, so the left picture's fade-out crosses over the top
    // of the middle one rather than under it
    var midBase = document.createElement("div");
    midBase.className = "kbg-midbase";
    midBase.setAttribute("aria-hidden", "true");

    ["mid", "leftmid", "left", "right"].forEach(function (region) {
      var el = document.createElement("div");
      el.className = "kbg-half kbg-half--" + region;
      el.setAttribute("aria-hidden", "true");
      banner.appendChild(el);
    });

    // after the pictures, so the middle's colour wash paints over both of
    // the layers that reach into it
    var midTint = document.createElement("div");
    midTint.className = "kbg-midtint";
    midTint.setAttribute("aria-hidden", "true");
    banner.appendChild(midTint);

    ["left", "right"].forEach(function (side) {
      var tint = document.createElement("div");
      tint.className = "kbg-sidetint kbg-sidetint--" + side;
      tint.setAttribute("aria-hidden", "true");
      banner.appendChild(tint);
    });

    // and its base colour goes in front of them all, so it paints under
    banner.insertBefore(midBase, banner.firstChild);

    root.appendChild(banner);
    root.appendChild(hikari);
    root.appendChild(homura);

    syncPersistentBackground();
  }

  /* shows the background only on pages built on InnerLayout (marked by
     .notes-shell) and hides it on the home page. Re-run on every
     astro:page-load, since <body>'s content has just been replaced by
     the time that event fires. */
  /* Reviews' two background illustrations flank the content panel rather
     than running behind it: the left strip covers everything up to the
     panel's left edge, the right strip everything past its right edge,
     and the old sky shows through the gap between them. Only the strips'
     boxes are measured here — which picture each one carries and how it's
     anchored is CSS's job. Re-measured whenever the panel's box changes,
     since its width comes from a max-width'd, centered container. */
  function initKisekiSplit() {
    var banner = document.querySelector(".notes-top-banner--kiseki");
    var shell = document.querySelector(".notes-shell");
    if (!banner || !shell) return;

    var rect = shell.getBoundingClientRect();
    var vw = document.documentElement.clientWidth;

    // left of the panel, the panel's own width, and right of it — the
    // colour blocks take exactly the same three boxes as the pictures
    var boxes = {
      left: [0, Math.max(0, rect.left)],
      // the two layers that reach into the middle both live in the middle
      // region's own box, one masked from each edge
      leftmid: [rect.left, Math.max(0, rect.width)],
      mid: [rect.left, Math.max(0, rect.width)],
      right: [rect.right, Math.max(0, vw - rect.right)],
    };

    [".kbg-midbase", ".kbg-midtint"].forEach(function (sel) {
      var el = document.querySelector(sel);
      if (!el) return;
      el.style.left = rect.left + "px";
      el.style.width = Math.max(0, rect.width) + "px";
    });

    Object.keys(boxes).forEach(function (region) {
      [".kbg-half--", ".kbg-sidetint--"].forEach(function (sel) {
        var el = document.querySelector(sel + region);
        if (!el) return;
        el.style.left = boxes[region][0] + "px";
        el.style.width = boxes[region][1] + "px";
        // this box starts at the panel's left edge rather than the
        // screen's, so the picture inside it has to be pulled back by
        // that much to stay lined up with its own half outside
        if (region === "leftmid") {
          el.style.setProperty("--kbg-box-shift", -rect.left + "px");
        }
      });
    });
  }

  function syncPersistentBackground() {
    var visible = !!document.querySelector(".notes-shell");
    // these are persistent nodes shared by every page, so what they show
    // has to be re-decided on each navigation rather than baked into the
    // markup
    var isLibrary = !!document.querySelector('[data-page="library"]');

    var banner = document.querySelector(".notes-top-banner");
    if (banner) {
      banner.hidden = !visible;
      banner.classList.toggle("notes-top-banner--kiseki", isLibrary);
    }

    // Reviews carries its own full illustration instead, which the two
    // line-art figures would only fight with
    document
      .querySelectorAll("#notes-char-hikari, #notes-char-homura")
      .forEach(function (el) {
        el.hidden = !visible || isLibrary;
      });

    initKisekiSplit();
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
    dividerResizeTimer = setTimeout(function () {
      initQuadrantDividers();
      initKisekiSplit();
    }, 100);
  });

  // astro:page-load fires after the initial load AND after every
  // subsequent soft navigation (DOMContentLoaded only ever saw the
  // former) — everything that depends on page-specific DOM must re-run
  // here so it rebinds to whatever just got swapped in
  document.addEventListener("astro:page-load", function () {
    initClock();
    initLibraryGrid();
    initProjectSizeTest();
    initNavPortrait();
    initFilterTabs();
    // after the appliers and after the filter, since both change the
    // panel's own box — the appliers via radius/frame width, the filter
    // by hiding most of the cards
    initQuadrantDividers();
    initQuadrantDividerWatch();
    initNotesAccordion();
    initNotesCollapseButtons();
    initProjectModals();
    syncPersistentBackground();
  });
})();
