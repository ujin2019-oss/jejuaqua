$(function () {
  var $window = $(window);
  var $header = $(".site-header");
  var $menuBtn = $(".menu-btn");
  var $mobileMenu = $(".mobile-menu");
  var $quickItems = $(".quick-item");
  function scrollToTarget(target) {
    var $target = $(target);

    if (!$target.length) {
      return;
    }

    $("html, body").stop().animate({
      scrollTop: $target.offset().top - $header.outerHeight() + 1
    }, 520);
  }

  $menuBtn.on("click", function () {
    var isOpen = !$(this).hasClass("is-open");

    $(this).toggleClass("is-open", isOpen);
    $header.toggleClass("is-menu-open", isOpen);
    $mobileMenu.stop().slideToggle(220).toggleClass("is-open", isOpen);
  });

  $(".gnb a, .mobile-menu a, .logo a").on("click", function (event) {
    var target = $(this).attr("href");

    if (target && target.charAt(0) === "#") {
      event.preventDefault();
      scrollToTarget(target);
      $menuBtn.removeClass("is-open");
      $header.removeClass("is-menu-open");
      $mobileMenu.stop().slideUp(180).removeClass("is-open");
    }
  });

  $quickItems.on("click", function () {
    var target = $(this).data("target");

    $quickItems.removeClass("active");
    $(this).addClass("active");
    scrollToTarget(target);
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

  $window.on("scroll", function () {
    var scrollTop = $window.scrollTop();

    $quickItems.each(function () {
      var target = $(this).data("target");
      var $section = $(target);

      if ($section.length && scrollTop >= $section.offset().top - 220) {
        $quickItems.removeClass("active");
        $(this).addClass("active");
      }
    });
  });
});
