
(function () {
  var STORAGE_KEY = "cookie_consent_v2";

  function hasGtag() {
    return typeof window.gtag === "function";
  }

  function saveChoice(type) {
    localStorage.setItem(STORAGE_KEY, type);

    if (!hasGtag()) return;

    var consentMap = {
      accept_all: {
        analytics_storage: "granted",
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
      },
      analytics_only: {
        analytics_storage: "granted",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      },
      reject_all: {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      },
    };

    window.gtag("consent", "update", consentMap[type]);
  }

  function setDefaultDenied() {
    if (!hasGtag()) return;
    window.gtag("consent", "default", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      wait_for_update: 500
    });
  }

  function injectCss() {
    if (document.getElementById("cookie-consent-css")) return;

    var link = document.createElement("link");
    link.id = "cookie-consent-css";
    link.rel = "stylesheet";
    link.href = "/consent.css";
    document.head.appendChild(link);
  }

  function buildBanner() {
    var wrap = document.createElement("div");
    wrap.className = "cc-wrapper";

    wrap.innerHTML = `
      <div class="cc-card">
        <div class="cc-header">We respect your privacy</div>
        <div class="cc-body">
          We use cookies for site functionality, analytics, and advertising.
          You can choose what you allow.
        </div>
        <div class="cc-actions">
          <button class="cc-btn cc-accept" data-choice="accept_all">Accept all</button>
          <button class="cc-btn cc-analytics" data-choice="analytics_only">Only analytics</button>
          <button class="cc-btn cc-reject" data-choice="reject_all">Reject all</button>
        </div>
        <div class="cc-links">
          <a href="/privacy.html">Privacy Policy</a>
          <a href="/cookie-policy.html">Cookie Policy</a>
        </div>
      </div>
    `;

    document.body.appendChild(wrap);

    wrap.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-choice]");
      if (!btn) return;

      saveChoice(btn.dataset.choice);
      wrap.remove();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (localStorage.getItem(STORAGE_KEY)) return;

    setDefaultDenied();
    injectCss();
    buildBanner();
  });
})();

