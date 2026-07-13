/* ═══════════════════════════════════════════════════════════════════════════
   Proelium Artifex — Analytics Providers
   Provider implementations consumed by analytics.js. See analytics.md.
   Load order: analytics-providers.js BEFORE analytics.js.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Base class ──────────────────────────────────────────────────────────
     Every provider implements: init(), pageView(name, params),
     event(name, params), disable(). analytics.js only ever talks to this
     interface, so adding a provider = subclass + register in analytics.js. */
  function AnalyticsProvider(config) {
    this.config = config || {};
    this.loaded = false;
  }
  AnalyticsProvider.prototype.name = 'base';
  AnalyticsProvider.prototype.isConfigured = function () { return false; };
  AnalyticsProvider.prototype.init = function () {};
  AnalyticsProvider.prototype.pageView = function (_pageName, _params) {};
  AnalyticsProvider.prototype.event = function (_name, _params) {};
  AnalyticsProvider.prototype.disable = function () {};

  /* ── Google Analytics 4 ────────────────────────────────────────────────── */
  function GoogleAnalyticsProvider(config) {
    AnalyticsProvider.call(this, config);
  }
  GoogleAnalyticsProvider.prototype = Object.create(AnalyticsProvider.prototype);
  GoogleAnalyticsProvider.prototype.constructor = GoogleAnalyticsProvider;
  GoogleAnalyticsProvider.prototype.name = 'ga4';

  GoogleAnalyticsProvider.prototype.isConfigured = function () {
    var id = this.config.measurementId || '';
    return id.indexOf('G-') === 0 && id.indexOf('XXXX') === -1;
  };

  GoogleAnalyticsProvider.prototype.init = function () {
    if (this.loaded || !this.isConfigured()) return;
    var id = this.config.measurementId;
    // Clear a previous opt-out from this session, if any.
    window['ga-disable-' + id] = false;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    this._gtag = function () { window.dataLayer.push(arguments); };
    this._gtag('js', new Date());
    // send_page_view:false — analytics.js sends explicit, named page views.
    this._gtag('config', id, { anonymize_ip: true, send_page_view: false });
    this.loaded = true;
  };

  GoogleAnalyticsProvider.prototype.pageView = function (pageName, params) {
    if (!this.loaded) return;
    var p = params || {};
    p.page_name = pageName;
    p.page_location = location.href;
    p.page_title = document.title;
    this._gtag('event', 'page_view', p);
  };

  GoogleAnalyticsProvider.prototype.event = function (name, params) {
    if (!this.loaded) return;
    this._gtag('event', name, params || {});
  };

  GoogleAnalyticsProvider.prototype.disable = function () {
    var id = this.config.measurementId;
    // Official gtag opt-out flag: stops all further hits immediately.
    window['ga-disable-' + id] = true;
    // Purge GA cookies.
    var names = ['_ga', '_gid', '_gat', '_ga_' + String(id).replace('G-', '')];
    for (var i = 0; i < names.length; i++) {
      document.cookie = names[i] + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=' + location.hostname;
      document.cookie = names[i] + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
    }
    this.loaded = false;
  };

  /* ── Microsoft Clarity ─────────────────────────────────────────────────── */
  function MicrosoftClarityProvider(config) {
    AnalyticsProvider.call(this, config);
  }
  MicrosoftClarityProvider.prototype = Object.create(AnalyticsProvider.prototype);
  MicrosoftClarityProvider.prototype.constructor = MicrosoftClarityProvider;
  MicrosoftClarityProvider.prototype.name = 'clarity';

  MicrosoftClarityProvider.prototype.isConfigured = function () {
    var id = this.config.projectId || '';
    return id.length > 0 && id.indexOf('XXXX') === -1;
  };

  MicrosoftClarityProvider.prototype.init = function () {
    if (this.loaded || !this.isConfigured()) return;
    var id = this.config.projectId;
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', id);
    // Signal that cookie consent has been granted (we only init after consent).
    window.clarity('consent');
    this.loaded = true;
  };

  MicrosoftClarityProvider.prototype.pageView = function (pageName) {
    if (!this.loaded) return;
    window.clarity('set', 'page_name', pageName);
  };

  MicrosoftClarityProvider.prototype.event = function (name) {
    if (!this.loaded) return;
    window.clarity('event', name);
  };

  MicrosoftClarityProvider.prototype.disable = function () {
    if (window.clarity) {
      try { window.clarity('stop'); } catch (e) { /* not yet loaded */ }
    }
    this.loaded = false;
  };

  /* Handoff to analytics.js (consumed and deleted there — no lasting global). */
  window.__paProviders = {
    AnalyticsProvider: AnalyticsProvider,
    GoogleAnalyticsProvider: GoogleAnalyticsProvider,
    MicrosoftClarityProvider: MicrosoftClarityProvider
  };
})();
