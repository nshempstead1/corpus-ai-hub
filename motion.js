(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer: fine)").matches;
  var body = document.body;

  /* ---------- nav chrome ---------- */
  var nav = document.querySelector(".top");
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle("scrolled", window.scrollY > 8);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  var toggle = document.querySelector(".nav-toggle");
  var siteNav = document.getElementById("site-nav");
  if (toggle && siteNav) {
    var closeNav = function () {
      siteNav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
      body.classList.remove("nav-open");
    };
    toggle.addEventListener("click", function () {
      var open = !siteNav.classList.contains("open");
      siteNav.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      body.classList.toggle("nav-open", open);
    });
    siteNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeNav);
    });
    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav();
    });
  }

  /* ---------- pointer glow ---------- */
  var glow = document.querySelector(".pointer-glow");
  if (glow && fine && !reduce) {
    var gx = 0, gy = 0, tx = 0, ty = 0;
    window.addEventListener("pointermove", function (e) {
      tx = e.clientX;
      ty = e.clientY;
    }, { passive: true });
    (function loop() {
      gx += (tx - gx) * 0.16;
      gy += (ty - gy) * 0.16;
      glow.style.transform = "translate(" + (gx - 180) + "px," + (gy - 180) + "px)";
      requestAnimationFrame(loop);
    })();
  } else if (glow) {
    glow.style.display = "none";
  }

  /* ---------- card spotlight + tilt ---------- */
  document.querySelectorAll(".card, .b-card, .price-card, .sku-card").forEach(function (el) {
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      var x = e.clientX - r.left;
      var y = e.clientY - r.top;
      el.style.setProperty("--mx", x + "px");
      el.style.setProperty("--my", y + "px");
      if (!reduce && fine && r.width > 0) {
        var rx = ((y / r.height) - 0.5) * -6;
        var ry = ((x / r.width) - 0.5) * 8;
        el.style.transform = "perspective(900px) rotateX(" + rx + "deg) rotateY(" + ry + "deg) translateY(-2px)";
      }
    });
    el.addEventListener("pointerleave", function () {
      el.style.transform = "";
    });
  });

  /* ---------- magnetic buttons ---------- */
  if (fine && !reduce) {
    document.querySelectorAll(".btn").forEach(function (btn) {
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * 0.22;
        var dy = (e.clientY - (r.top + r.height / 2)) * 0.28;
        btn.style.transform = "translate(" + dx + "px," + dy + "px)";
      });
      btn.addEventListener("pointerleave", function () {
        btn.style.transform = "";
      });
    });
  }

  /* ---------- scroll reveals ---------- */
  var nodes = document.querySelectorAll(".reveal");
  if (nodes.length) {
    if (!("IntersectionObserver" in window) || reduce) {
      nodes.forEach(function (el) { el.classList.add("in"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });
      nodes.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- count-up stats ---------- */
  document.querySelectorAll("[data-count]").forEach(function (el) {
    var target = el.getAttribute("data-count");
    var suffix = el.getAttribute("data-suffix") || "";
    var run = function () {
      if (reduce) {
        el.textContent = target + suffix;
        return;
      }
      var n = parseFloat(target);
      if (isNaN(n)) {
        el.textContent = target + suffix;
        return;
      }
      var start = performance.now();
      var dur = 1100;
      var tick = function (now) {
        var t = Math.min(1, (now - start) / dur);
        var eased = 1 - Math.pow(1 - t, 3);
        var val = n % 1 === 0 ? Math.round(n * eased) : (n * eased).toFixed(0);
        el.textContent = val + suffix;
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = target + suffix;
      };
      requestAnimationFrame(tick);
    };
    if (!("IntersectionObserver" in window)) run();
    else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            run();
            cio.unobserve(el);
          }
        });
      }, { threshold: 0.4 });
      cio.observe(el);
    }
  });

  /* ---------- neural field ---------- */
  var canvas = document.getElementById("field");
  if (canvas && canvas.getContext && !reduce) {
    var ctx = canvas.getContext("2d");
    var nodes2 = [];
    var mouse = { x: -9999, y: -9999 };
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var running = true;

    var resize = function () {
      var parent = canvas.parentElement;
      var w = parent.clientWidth;
      var h = parent.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.max(36, Math.min(78, Math.floor((w * h) / 18000)));
      nodes2 = [];
      for (var i = 0; i < count; i++) {
        nodes2.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: 1.1 + Math.random() * 1.6
        });
      }
    };

    window.addEventListener("resize", resize, { passive: true });
    canvas.parentElement.addEventListener("pointermove", function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    }, { passive: true });
    canvas.parentElement.addEventListener("pointerleave", function () {
      mouse.x = -9999;
      mouse.y = -9999;
    });

    document.addEventListener("visibilitychange", function () {
      running = document.visibilityState === "visible";
    });

    resize();

    (function draw() {
      if (!running) {
        requestAnimationFrame(draw);
        return;
      }
      var w = canvas.clientWidth;
      var h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      var i, j, a, b, dx, dy, dist, max = 130;
      for (i = 0; i < nodes2.length; i++) {
        a = nodes2[i];
        a.x += a.vx;
        a.y += a.vy;
        if (a.x < 0 || a.x > w) a.vx *= -1;
        if (a.y < 0 || a.y > h) a.vy *= -1;
        dx = mouse.x - a.x;
        dy = mouse.y - a.y;
        dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180 && dist > 1) {
          a.vx += dx * 0.00008;
          a.vy += dy * 0.00008;
        }
        var sp = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
        if (sp > 0.7) {
          a.vx *= 0.96;
          a.vy *= 0.96;
        }
      }
      for (i = 0; i < nodes2.length; i++) {
        a = nodes2[i];
        for (j = i + 1; j < nodes2.length; j++) {
          b = nodes2[j];
          dx = a.x - b.x;
          dy = a.y - b.y;
          dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < max) {
            ctx.strokeStyle = "rgba(12,184,164," + (0.16 * (1 - dist / max)) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        dx = mouse.x - a.x;
        dy = mouse.y - a.y;
        dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 160) {
          ctx.strokeStyle = "rgba(79,216,198," + (0.22 * (1 - dist / 160)) + ")";
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
        ctx.fillStyle = "rgba(12,184,164,0.7)";
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(draw);
    })();
  } else if (canvas) {
    canvas.style.display = "none";
  }

  /* ---------- Corpus OS console ---------- */
  var os = document.getElementById("os");
  if (os) {
    var tabs = os.querySelectorAll("[data-os-tab]");
    var views = os.querySelectorAll("[data-os-view]");
    var feed = os.querySelector("[data-os-feed]");
    var userLocked = false;
    var idx = 0;
    var events = [
      { kind: "ok", text: "Stripe payment received — SLA clock started", meta: "60s" },
      { kind: "ok", text: "corpushq.co · HTTP 200 · TLS valid 89d", meta: "60s" },
      { kind: "warn", text: "Google listing fingerprint changed — review ping", meta: "≤15m" },
      { kind: "ok", text: "Applylane · submitted on Lever · credit 12/50", meta: "live" },
      { kind: "ok", text: "Order Desk · intake marked done · clock cleared", meta: "human" },
      { kind: "ok", text: "Watch Desk · SSL expiry check passed", meta: "60s" },
      { kind: "warn", text: "Rank Grid snapshot ready — 3 keywords moved", meta: "daily" },
      { kind: "ok", text: "Telegram alert delivered to ops channel", meta: "60s" }
    ];
    var evI = 0;

    var show = function (id) {
      tabs.forEach(function (t) {
        var on = t.getAttribute("data-os-tab") === id;
        t.classList.toggle("on", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      views.forEach(function (v) {
        v.classList.toggle("on", v.getAttribute("data-os-view") === id);
      });
    };

    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        userLocked = true;
        show(t.getAttribute("data-os-tab"));
      });
    });

    if (!reduce) {
      setInterval(function () {
        if (userLocked) return;
        idx = (idx + 1) % tabs.length;
        show(tabs[idx].getAttribute("data-os-tab"));
      }, 7000);
    }

    var pushFeed = function () {
      if (!feed) return;
      var ev = events[evI % events.length];
      evI++;
      var row = document.createElement("div");
      row.className = "alertline" + (ev.kind === "warn" ? " warn" : "");
      row.innerHTML = '<span class="pulse"></span> ' + ev.text + " <small>" + ev.meta + "</small>";
      feed.insertBefore(row, feed.firstChild);
      while (feed.children.length > 4) feed.removeChild(feed.lastChild);
    };

    if (feed && !reduce) {
      setInterval(pushFeed, 3200);
    }

    /* sparkline redraw */
    var spark = os.querySelector(".spark polyline");
    if (spark && !reduce) {
      var pts = function () {
        var out = [];
        var y = 28;
        for (var x = 0; x <= 400; x += 28) {
          y = Math.max(6, Math.min(40, y + (Math.random() - 0.55) * 10));
          out.push(x + "," + y.toFixed(1));
        }
        return out.join(" ");
      };
      setInterval(function () {
        spark.setAttribute("points", pts());
      }, 4200);
    }

    /* SLA countdown in the services-ish view */
    var sla = os.querySelector("[data-sla]");
    if (sla) {
      var remain = 3 * 3600 + 41 * 60;
      var tickSla = function () {
        var h = Math.floor(remain / 3600);
        var m = Math.floor((remain % 3600) / 60);
        sla.textContent = h + "h " + (m < 10 ? "0" : "") + m + "m";
        remain = Math.max(0, remain - 1);
      };
      tickSla();
      setInterval(tickSla, 1000);
    }
  }

  /* ---------- product filters ---------- */
  var filters = document.querySelector("[data-filter-bar]");
  if (filters) {
    var chips = filters.querySelectorAll("[data-filter]");
    var items = document.querySelectorAll("[data-kind]");
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var kind = chip.getAttribute("data-filter");
        chips.forEach(function (c) { c.classList.toggle("on", c === chip); });
        items.forEach(function (item) {
          var ok = kind === "all" || item.getAttribute("data-kind") === kind;
          item.hidden = !ok;
        });
      });
    });
  }

  /* ---------- command palette ---------- */
  var cmdk = document.getElementById("cmdk");
  var cmdInput = cmdk && cmdk.querySelector(".cmdk-input");
  var cmdList = cmdk && cmdk.querySelector(".cmdk-list");
  var commands = [
    { t: "Order Desk — $29/mo", k: "Subscribe", h: "https://buy.stripe.com/bJe9ALdC91aVgVR7VJco11z" },
    { t: "Watch Desk — $12/mo", k: "Subscribe", h: "https://buy.stripe.com/4gM9AL41zcTDbBx7VJco11r" },
    { t: "Applylane Starter — $49", k: "Product", h: "/apply/" },
    { t: "Products", k: "Page", h: "/products" },
    { t: "Growth", k: "Page", h: "/growth" },
    { t: "Services", k: "Page", h: "/services" },
    { t: "Localization", k: "Page", h: "/localization" },
    { t: "About", k: "Page", h: "/about" },
    { t: "Email intake", k: "Action", h: "mailto:intake@corpuslocalization.com" },
    { t: "OpenClaw setup — $299", k: "Subscribe", h: "https://buy.stripe.com/00w5kv7dL3j39tpdg3co11s" },
    { t: "Rank Grid — $19/mo", k: "Subscribe", h: "https://buy.stripe.com/eVqbITfKhcTD4958ZNco11x" },
    { t: "GBP appeal packet — $149", k: "Service", h: "https://nshempstead1.github.io/corpus-ai/" }
  ];
  var active = 0;

  var renderCmd = function (q) {
    if (!cmdList) return;
    var needle = (q || "").toLowerCase();
    var hits = commands.filter(function (c) {
      return !needle || (c.t + " " + c.k).toLowerCase().indexOf(needle) !== -1;
    });
    cmdList.innerHTML = hits.map(function (c, i) {
      return '<li><a class="cmdk-item' + (i === 0 ? " on" : "") + '" href="' + c.h + '"><span>' + c.t + '</span><em>' + c.k + "</em></a></li>";
    }).join("") || "<li class='cmdk-empty'>No matches</li>";
    active = 0;
  };

  var openCmd = function () {
    if (!cmdk) return;
    cmdk.removeAttribute("hidden");
    body.classList.add("cmdk-open");
    renderCmd("");
    if (cmdInput) {
      cmdInput.value = "";
      setTimeout(function () { cmdInput.focus(); }, 10);
    }
  };
  var closeCmd = function () {
    if (!cmdk) return;
    cmdk.setAttribute("hidden", "");
    body.classList.remove("cmdk-open");
  };

  document.querySelectorAll("[data-cmdk]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      openCmd();
    });
  });

  window.addEventListener("keydown", function (e) {
    var meta = e.metaKey || e.ctrlKey;
    if (meta && (e.key === "k" || e.key === "K")) {
      e.preventDefault();
      if (cmdk && !cmdk.hidden) closeCmd();
      else openCmd();
      return;
    }
    if (!cmdk || cmdk.hidden) return;
    var items = cmdList.querySelectorAll(".cmdk-item");
    if (e.key === "Escape") {
      closeCmd();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      active = Math.min(items.length - 1, active + 1);
      items.forEach(function (it, i) { it.classList.toggle("on", i === active); });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      active = Math.max(0, active - 1);
      items.forEach(function (it, i) { it.classList.toggle("on", i === active); });
    } else if (e.key === "Enter" && items[active]) {
      e.preventDefault();
      items[active].click();
    }
  });

  if (cmdInput) {
    cmdInput.addEventListener("input", function () {
      renderCmd(cmdInput.value);
    });
  }
  if (cmdk) {
    cmdk.addEventListener("click", function (e) {
      if (e.target === cmdk) closeCmd();
    });
  }
})();
