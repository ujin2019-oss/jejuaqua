$(function () {
  var $window = $(window);
  var $header = $(".site-header");
  var $menuBtn = $(".menu-btn");
  var $mobileMenu = $(".mobile-menu");
  var $quickItems = $(".quick-item");
  var $quickMenu = $(".quick-menu");
  var $quickButtons = $(".quick-buttons");
  var $quickToggle = $(".quick-toggle");
  var $quickSlots = $(".quick-indicator-slot");
  var hero = document.getElementById("hero");
  var quickCompact = false;
  var quickExpanded = false;
  var quickHovered = false;
  var quickFocus = false;
  var suppressQuickFocus = false;
  var quickPointerInput = false;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var mobileNavigation = window.matchMedia("(max-width: 767px)");
  var pendingQuickTarget = null;
  var scrollVersion = 0;
  var quickFrame = null;
  var mobileNavSolid = false;

  function topOffset() {
    return mobileNavigation.matches ? $quickMenu.outerHeight() + 16 : 0;
  }

  function renderQuick() {
    var open = mobileNavigation.matches || !quickCompact || quickExpanded || quickHovered || quickFocus;
    $quickMenu.toggleClass("is-compact", quickCompact).toggleClass("is-expanded", open);
    $quickButtons.prop("inert", !open).attr("aria-hidden", String(!open));
    $quickItems.attr("tabindex", open ? "0" : "-1");
    $quickToggle.attr({
      "aria-expanded": String(open),
      "aria-disabled": String(!quickCompact),
      "aria-label": open ? "빠른 메뉴 접기" : "빠른 메뉴 펼치기",
      "tabindex": quickCompact ? "0" : "-1"
    });
  }

  function closeQuick(restoreFocus) {
    quickExpanded = false;
    quickHovered = false;
    quickFocus = false;
    if (restoreFocus) {
      suppressQuickFocus = true;
      $quickToggle[0].focus({ preventScroll: true });
      suppressQuickFocus = false;
    }
    renderQuick();
  }

  function setQuickCurrent(current) {
    $quickItems.each(function () {
      var active = this === current;
      $(this).toggleClass("active", active);
      if (active) $(this).attr("aria-current", "location");
      else $(this).removeAttr("aria-current");
    });
    var target = current ? $(current).data("target") : null;
    $quickSlots.each(function () {
      $(this).toggleClass("active", $(this).data("target") === target);
    });
  }

  $quickToggle.on("click", function () {
    if (!quickCompact) return;
    quickExpanded = $(this).attr("aria-expanded") !== "true";
    quickFocus = false;
    renderQuick();
  });

  $quickMenu.on("pointerdown", function () {
    quickPointerInput = true;
  }).on("pointerenter", function (event) {
    var pointer = event.pointerType || (event.originalEvent && event.originalEvent.pointerType);
    if (pointer === "mouse" && window.matchMedia("(hover: hover)").matches) {
      quickHovered = true;
      renderQuick();
    }
  }).on("pointerleave", function () {
    quickHovered = false;
    renderQuick();
  }).on("focusin", function (event) {
    if (!suppressQuickFocus && ($(event.target).closest(".quick-buttons").length || (!quickPointerInput && event.target.matches(":focus-visible")))) {
      quickFocus = true;
      renderQuick();
    }
  }).on("focusout", function (event) {
    if (!this.contains(event.relatedTarget)) {
      quickExpanded = false;
      quickFocus = false;
      renderQuick();
    }
  });

  function setMenu(open, restoreFocus) {
    $mobileMenu.stop(true, true);
    $menuBtn.toggleClass("is-open", open)
      .attr("aria-expanded", String(open))
      .attr("aria-label", open ? "전체 메뉴 닫기" : "전체 메뉴 열기");
    $header.toggleClass("is-menu-open", open);
    if (open) {
      $mobileMenu.prop("hidden", false).addClass("is-open").hide()
        .slideDown(reducedMotion.matches ? 0 : 220);
    } else {
      $mobileMenu.slideUp(reducedMotion.matches ? 0 : 180, function () {
        $(this).prop("hidden", true).removeClass("is-open");
      });
      if (restoreFocus) $menuBtn.trigger("focus");
    }
  }

  function scrollToTarget(target) {
    if (!target || target === "#" || target.charAt(0) !== "#") return;
    var element = document.getElementById(target.slice(1));
    var $target = $(element);

    if (!$target.length) {
      return;
    }

    // Cancel the previous animation before assigning its replacement's active state.
    var version = ++scrollVersion;
    $("html, body").stop(true);
    pendingQuickTarget = mobileNavigation.matches ? $quickItems.filter(function () {
      return $(this).data("target") === target;
    })[0] || null : null;
    if (pendingQuickTarget) setQuickCurrent(pendingQuickTarget);
    var destinationTop = mobileNavigation.matches && target === "#hero" ? 0 : Math.max(0, Math.min(
      $target.offset().top - topOffset(),
      document.documentElement.scrollHeight - window.innerHeight
    ));

    $("html, body").animate({
      scrollTop: destinationTop
    }, reducedMotion.matches ? 0 : 520).promise().done(function () {
      if (version !== scrollVersion) return;
      pendingQuickTarget = null;
      updateQuickState();
    });
  }

  $menuBtn.on("click", function () {
    setMenu($(this).attr("aria-expanded") !== "true");
  });

  $(document).on("keydown", function (event) {
    quickPointerInput = false;
    if (event.key === "Escape" && quickCompact && $quickMenu[0].contains(document.activeElement)) {
      closeQuick(true);
      return;
    }
    if ($menuBtn.attr("aria-expanded") !== "true") return;
    if (event.key === "Escape") {
      setMenu(false, true);
    } else if (event.key === "Tab") {
      var $last = $mobileMenu.find("a").last();
      if (event.shiftKey && document.activeElement === $menuBtn[0]) {
        event.preventDefault();
        $last.trigger("focus");
      } else if (!event.shiftKey && document.activeElement === $last[0]) {
        event.preventDefault();
        $menuBtn.trigger("focus");
      }
    }
  }).on("click", function (event) {
    if (quickCompact && !$(event.target).closest(".quick-menu").length) closeQuick(false);
    if ($menuBtn.attr("aria-expanded") === "true" && !$(event.target).closest(".site-header").length) {
      setMenu(false);
    }
  });

  $window.on("resize", function () {
    if ($menuBtn.attr("aria-expanded") === "true") setMenu(false, true);
  });

  $(".gnb a, .mobile-menu a, .logo a").on("click", function (event) {
    var target = $(this).attr("href");

    if (target && target.charAt(0) === "#") {
      event.preventDefault();
      scrollToTarget(target);
      var fromMenu = $(this).closest(".mobile-menu").length;
      setMenu(false);
      if (fromMenu) {
        var destination = document.getElementById(target.slice(1));
        if (destination) {
          $(destination).attr("tabindex", "-1");
          destination.focus({ preventScroll: true });
        }
      }
    }
  });

  $quickItems.on("click", function () {
    var target = $(this).data("target");

    setQuickCurrent(this);
    scrollToTarget(target);
    var section = document.getElementById(target.slice(1));
    if ($quickButtons[0].contains(document.activeElement) && section) {
      section.setAttribute("tabindex", "-1");
      section.focus({ preventScroll: true });
    }
    if (quickCompact) closeQuick(false);
  });

  $(".line-btn, .program-body a, .notice-banner a").on("click", function (event) {
    var target = $(this).attr("href");

    if (target && target.charAt(0) === "#") {
      event.preventDefault();
      scrollToTarget(target);
    }
  });

  $(".animal-card, .program-card").on("mouseenter focusin", function () {
    $(this).addClass("is-hover");
  }).on("mouseleave focusout", function () {
    $(this).removeClass("is-hover");
  });

  function updateQuickState() {
    var heroBottom = hero.getBoundingClientRect().bottom;
    // Switch when the hero clears the section bar; an 8px return band avoids flicker.
    if (mobileNavigation.matches) {
      var navHeight = $quickMenu.outerHeight();
      if (heroBottom <= navHeight) mobileNavSolid = true;
      else if (heroBottom > navHeight + 8) mobileNavSolid = false;
    } else {
      mobileNavSolid = false;
    }
    $quickMenu.toggleClass("is-past-hero", mobileNavSolid);
    // A scrolled-away header must not leave the sticky section bar hidden.
    if (mobileNavigation.matches && $menuBtn.attr("aria-expanded") === "true" && $header[0].getBoundingClientRect().bottom <= 0) {
      setMenu(false);
    }
    var compact = !mobileNavigation.matches && heroBottom <= 0;
    if (compact !== quickCompact) {
      quickCompact = compact;
      quickExpanded = false;
      quickHovered = false;
      quickFocus = $quickMenu[0].contains(document.activeElement);
    }
    var probe = $window.scrollTop() + (mobileNavigation.matches ? topOffset() + 1 : Math.min(220, $window.height() * .3));
    var current = null;
    var currentTop = -Infinity;

    $quickItems.each(function () {
      var $section = $($(this).data("target"));
      if (!$section.length) return;
      var top = $section.offset().top;
      if (probe >= top && probe < top + $section.outerHeight() && top > currentTop) {
        current = this;
        currentTop = top;
      }
    });
    setQuickCurrent(pendingQuickTarget || current);
    renderQuick();
  }

  function interruptScroll() {
    ++scrollVersion;
    pendingQuickTarget = null;
    $("html, body").stop(true);
    updateQuickState();
  }
  // A deliberate manual scroll releases the selected-tab lock immediately.
  window.addEventListener("wheel", interruptScroll, { passive: true });
  window.addEventListener("touchstart", interruptScroll, { passive: true });
  $(document).on("keydown", function (event) {
    if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].indexOf(event.key) !== -1 && !$(event.target).is("button, a, input, textarea, select")) interruptScroll();
  });
  mobileNavigation.addEventListener("change", interruptScroll);
  $window.on("scroll resize", function () {
    if (quickFrame !== null) return;
    quickFrame = window.requestAnimationFrame(function () {
      quickFrame = null;
      updateQuickState();
    });
  });
  updateQuickState();
});
