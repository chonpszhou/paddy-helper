/* Paddy小助手 官网交互 */
(function () {
  "use strict";

  /* 滚动浮现 */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* 数字滚动 */
  function animateCounter(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    if (el.dataset.done) return;
    el.dataset.done = "1";
    var start = null;
    var duration = 1300;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target;
    }
    requestAnimationFrame(tick);
  }
  var counters = document.querySelectorAll(".counter");
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            cio.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(function (el) { el.textContent = el.getAttribute("data-count"); });
  }

  /* 实时 Star 数 */
  var starEl = document.getElementById("starCount");
  if (starEl) {
    fetch("https://api.github.com/repos/chonpszhou/paddy-helper")
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) {
        if (data && typeof data.stargazers_count === "number") {
          starEl.setAttribute("data-count", data.stargazers_count);
          starEl.textContent = data.stargazers_count;
          starEl.dataset.done = "1";
        }
      })
      .catch(function () { /* 静默降级 */ });
  }

  /* 手机 3D 跟随鼠标 */
  var phoneWrap = document.getElementById("phoneWrap");
  var phone = document.getElementById("phone");
  if (phone && phoneWrap && window.matchMedia("(pointer: fine)").matches) {
    phoneWrap.addEventListener("mousemove", function (e) {
      var rect = phoneWrap.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      phone.style.transform =
        "rotateY(" + (x * 16).toFixed(2) + "deg) rotateX(" + (-y * 14).toFixed(2) + "deg)";
    });
    phoneWrap.addEventListener("mouseleave", function () {
      phone.style.transform = "rotateY(0deg) rotateX(0deg)";
    });
  }

  /* 导航滚动阴影 */
  var nav = document.getElementById("nav");
  window.addEventListener("scroll", function () {
    if (!nav) return;
    if (window.scrollY > 24) {
      nav.style.boxShadow = "0 16px 40px -16px rgba(30,64,175,0.25)";
    } else {
      nav.style.boxShadow = "0 20px 50px -18px rgba(30, 64, 175, 0.18), 0 6px 18px -8px rgba(30, 64, 175, 0.10)";
    }
  });
})();
