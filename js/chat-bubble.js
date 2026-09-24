// Chat bubble for the Raj Cassette site. Served from this website (instant),
// not from the chat server, which can take ~50s to wake on free hosting. Draws
// the bubble at once, loads the chat window from data-chat in the background,
// and swaps it in when the window reports "ready". Same logic as the chat
// server's /embed.js (flask_app/app_memory.py), which other sites still use.
// If you change one, change the other.
(function () {
  var currentScript = document.currentScript;
  // The chat server's address, from <script ... data-chat="https://...">.
  var base = (currentScript.getAttribute("data-chat") || "").replace(/\/+$/, "");
  if (!/^https?:\/\//.test(base)) return;
  // Optional: <script src=".../embed.js" data-whatsapp="9779800000000">
  var waNumber = (currentScript.getAttribute("data-whatsapp") || "").replace(/[^0-9]/g, "");

  var CLOSED_CSS =
    "position:fixed;bottom:20px;right:20px;width:64px;height:64px;" +
    "border:none;border-radius:50%;box-shadow:0 4px 20px rgba(0,0,0,.25);" +
    "z-index:2147483000;background:transparent;" +
    "transition:width .2s ease,height .2s ease,border-radius .2s ease;";

  // The chat server can take ~50s to wake up (free hosting). The bubble is
  // drawn here, on the client's page, so it shows instantly; the real chat
  // window stays hidden until it reports "ready", then takes the bubble's place.
  var ready = false, pendingOpen = false, note = null;

  var placeholder = document.createElement("button");
  placeholder.type = "button";
  placeholder.setAttribute("aria-label", "Open chat");
  placeholder.style.cssText =
    "position:fixed;bottom:20px;right:20px;width:64px;height:64px;border:none;border-radius:50%;" +
    "cursor:pointer;z-index:2147483001;display:flex;align-items:center;justify-content:center;" +
    "background:linear-gradient(135deg,#17C3D4 0%,#0FA8B8 100%);box-shadow:0 4px 20px rgba(0,0,0,.25);";
  var svgNS = "http://www.w3.org/2000/svg";
  var icon = document.createElementNS(svgNS, "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("width", "26");
  icon.setAttribute("height", "26");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "#fff");
  icon.setAttribute("stroke-width", "2");
  icon.setAttribute("stroke-linecap", "round");
  icon.setAttribute("stroke-linejoin", "round");
  var path = document.createElementNS(svgNS, "path");
  path.setAttribute("d", "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z");
  icon.appendChild(path);
  placeholder.appendChild(icon);

  function showNote(text) {
    if (!note) {
      note = document.createElement("div");
      note.setAttribute("role", "status");
      note.style.cssText =
        "position:fixed;bottom:96px;right:20px;max-width:260px;padding:12px 14px;border-radius:14px;" +
        "background:#fff;color:#1f2937;font:14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;" +
        "box-shadow:0 8px 32px rgba(0,0,0,.2);z-index:2147483001;";
      document.body.appendChild(note);
    }
    note.textContent = text;
    if (waNumber) {
      var a = document.createElement("a");
      a.href = "https://wa.me/" + waNumber;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = "Message us on WhatsApp";
      a.style.cssText =
        "display:block;margin-top:8px;padding:8px 12px;border-radius:999px;background:#25D366;" +
        "color:#fff;font-weight:600;text-align:center;text-decoration:none;";
      note.appendChild(a);
    }
  }

  placeholder.addEventListener("click", function () {
    pendingOpen = true;
    showNote(timedOut
      ? "Chat is unavailable right now."
      : "Chat is starting up. It can take up to a minute the first time, and it will open by itself.");
  });

  var iframe = document.createElement("iframe");
  iframe.src = base + "/?embed=1";
  iframe.title = "Chat";
  iframe.setAttribute("allow", "microphone");
  iframe.style.cssText = CLOSED_CSS + "visibility:hidden;";
  document.body.appendChild(iframe);
  document.body.appendChild(placeholder);

  var timedOut = false;
  setTimeout(function () {
    if (ready) return;
    timedOut = true;
    if (note) showNote("Chat is unavailable right now.");
  }, 90000);

  var isOpen = false;
  var OPEN_DESKTOP =
    "position:fixed;bottom:20px;right:20px;width:380px;height:min(640px,80vh);border:none;border-radius:16px;" +
    "box-shadow:0 8px 32px rgba(0,0,0,.3);z-index:2147483000;background:transparent;" +
    "transition:width .2s ease,height .2s ease,border-radius .2s ease;";
  // Phones: a sheet 88% of the screen tall, not full screen, so a dimmed strip
  // of the page stays visible above it. Tapping that strip closes the chat.
  var OPEN_PHONE =
    "position:fixed;left:0;right:0;bottom:0;width:100vw;height:88dvh;border:none;border-radius:16px 16px 0 0;" +
    "box-shadow:0 -8px 32px rgba(0,0,0,.3);z-index:2147483000;background:transparent;" +
    "transition:width .2s ease,height .2s ease,border-radius .2s ease;";

  var backdrop = document.createElement("div");
  backdrop.setAttribute("aria-hidden", "true");
  backdrop.style.cssText =
    "position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:2147482999;display:none;";
  document.body.appendChild(backdrop);

  // One place that opens or closes the widget. fromBack = the phone's Back
  // button already removed our history entry, so don't remove it again.
  function setOpen(open, fromBack) {
    if (open === isOpen) return;
    isOpen = open;
    if (open) {
      var phone = window.matchMedia("(max-width: 480px)").matches;
      iframe.style.cssText = phone ? OPEN_PHONE : OPEN_DESKTOP;
      backdrop.style.display = phone ? "block" : "none";
      // Back button closes the chat instead of leaving the site.
      try { history.pushState({ rupakcoChat: true }, ""); } catch (err) {}
    } else {
      iframe.style.cssText = CLOSED_CSS;
      // Keep the strip up a moment so the closing tap can't fall through
      // onto a link underneath it.
      setTimeout(function () { if (!isOpen) backdrop.style.display = "none"; }, 350);
      if (!fromBack && history.state && history.state.rupakcoChat) {
        try { history.back(); } catch (err) {}
      }
    }
  }

  function collapse(fromBack) {
    if (!isOpen) return;
    setOpen(false, fromBack);
    iframe.contentWindow.postMessage({ type: "rupakco-widget-collapse" }, "*");
  }

  window.addEventListener("message", function (e) {
    if (e.source !== iframe.contentWindow) return;
    if (!e.data) return;
    if (e.data.type === "rupakco-widget-ready") {
      if (ready) return;
      ready = true;
      iframe.style.cssText = CLOSED_CSS;
      placeholder.remove();
      if (note) { note.remove(); note = null; }
      if (pendingOpen) iframe.contentWindow.postMessage({ type: "rupakco-widget-open" }, "*");
      return;
    }
    if (e.data.type !== "rupakco-widget-resize") return;
    setOpen(e.data.state === "open");
  });

  window.addEventListener("popstate", function () { collapse(true); });
  backdrop.addEventListener("click", function () { collapse(false); });

  // Clicking anywhere on the host page outside the iframe collapses the
  // widget back to the bubble. A click landing inside the iframe never
  // reaches this listener (it's a separate document), so any mousedown
  // seen here is, by definition, an outside click.
  document.addEventListener("mousedown", function (e) {
    if (note && ready === false && !placeholder.contains(e.target) && !note.contains(e.target)) {
      note.remove(); note = null; pendingOpen = false;
    }
    collapse(false);
  });
})();
