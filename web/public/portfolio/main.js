/* CalShi portfolio — progressive enhancement only.
   Everything here is optional: with JavaScript off the page still reads,
   navigates, and shows every figure. */
(function () {
  "use strict";

  /* .js is already set by the inline head script, before first paint. */

  /* ----------------------------------------------------------- demo video -- */
  /* Swap the poster for the real player on click. Skipped on file://, where
     YouTube rejects the embed (error 153) — there the link just opens YouTube. */

  var videoLink = document.querySelector(".video-link");

  if (videoLink && window.location.protocol !== "file:") {
    videoLink.addEventListener("click", function (event) {
      event.preventDefault();
      var frame = document.createElement("iframe");
      frame.src = "https://www.youtube-nocookie.com/embed/Wi2v2XgjTx4?autoplay=1";
      frame.title = "CalShi demo video";
      frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; " +
                    "gyroscope; picture-in-picture; web-share";
      frame.referrerPolicy = "strict-origin-when-cross-origin";
      frame.allowFullscreen = true;
      videoLink.replaceWith(frame);
      frame.focus();
    });
  }

  /* ------------------------------------------------------ figure lightbox -- */

  var box = document.getElementById("lightbox");

  if (box && typeof box.showModal === "function") {
    var boxImg = document.getElementById("lightbox-img");
    var boxCap = document.getElementById("lightbox-cap");
    var opener = null;

    document.addEventListener("click", function (event) {
      var img = event.target.closest(".fig img");
      if (img) {
        var caption = img.closest("figure").querySelector("figcaption");
        boxImg.src = img.currentSrc || img.src;
        boxImg.alt = img.alt;
        boxCap.textContent = caption ? caption.textContent.trim() : "";
        opener = img;
        box.showModal();
        return;
      }
      /* clicking the backdrop, or the close button, dismisses */
      if (event.target === box || event.target.closest(".lightbox-close")) box.close();
    });

    box.addEventListener("close", function () {
      boxImg.removeAttribute("src");
      var target = opener;
      opener = null;
      /* wait for the browser's own focus restoration to finish first */
      if (target) setTimeout(function () { target.focus({ preventScroll: true }); }, 0);
    });

    /* make figures reachable and operable from the keyboard */
    document.querySelectorAll(".fig img").forEach(function (img) {
      img.tabIndex = 0;
      img.setAttribute("role", "button");
      img.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          img.click();
        }
      });
    });
  }

})();
