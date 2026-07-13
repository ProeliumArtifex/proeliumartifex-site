/* ═══════════════════════════════════════════════════════════════════════════
   Proelium Artifex — Analytics
   Single entry point for all analytics. The rest of the site calls the
   wrapper methods on the `analytics` singleton — never gtag()/clarity()
   directly. Providers live in analytics-providers.js. Docs: analytics.md.

   Consent: nothing loads or sends until the user accepts analytics cookies
   (pa_consent). Revoking consent disables all providers immediately.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Configuration ─────────────────────────────────────────────────────── */
  var CONFIG = {
    // GA4 Measurement ID (Admin → Data streams → Main Site).
    gaMeasurementId: 'G-D0KM0CB2Q4',
    // Microsoft Clarity Project ID (clarity.microsoft.com → project settings).
    // Leave '' until a Clarity project exists — provider stays dormant.
    clarityProjectId: '',
    // Debug mode: log events to console INSTEAD of sending them.
    // Auto-on for local development; force with localStorage 'pa_analytics_debug'='1'.
    debug: (function () {
      try {
        if (localStorage.getItem('pa_analytics_debug') === '1') return true;
        if (localStorage.getItem('pa_analytics_debug') === '0') return false;
      } catch (e) {}
      return location.protocol === 'file:' ||
             location.hostname === 'localhost' ||
             location.hostname === '127.0.0.1';
    })(),
    consentCookie: 'pa_consent',
    consentDays: 180
  };

  /* ── Providers ─────────────────────────────────────────────────────────── */
  var P = window.__paProviders || {};
  try { delete window.__paProviders; } catch (e) { window.__paProviders = undefined; }
  var providers = [];
  if (P.GoogleAnalyticsProvider) {
    providers.push(new P.GoogleAnalyticsProvider({ measurementId: CONFIG.gaMeasurementId }));
  }
  if (P.MicrosoftClarityProvider) {
    providers.push(new P.MicrosoftClarityProvider({ projectId: CONFIG.clarityProjectId }));
  }
  // Adding a provider later: create the class in analytics-providers.js and
  // push an instance here. Nothing else changes.

  /* ── Consent storage (cookie + localStorage mirror) ────────────────────── */
  function setCookie(name, value, days) {
    var d = new Date(); d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = name + '=' + encodeURIComponent(value) + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
  }
  function getCookie(name) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  }
  function readConsent() {
    var raw = getCookie(CONFIG.consentCookie);
    if (!raw) { try { raw = localStorage.getItem(CONFIG.consentCookie); } catch (e) {} }
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }
  function writeConsent(obj) {
    var raw = JSON.stringify(obj);
    setCookie(CONFIG.consentCookie, raw, CONFIG.consentDays);
    try { localStorage.setItem(CONFIG.consentCookie, raw); } catch (e) {}
  }

  /* ── Internal dispatch ─────────────────────────────────────────────────── */
  var enabled = false;

  function log() {
    if (!CONFIG.debug || !window.console) return;
    console.log.apply(console, ['%c[analytics]', 'color:#C9A76A'].concat([].slice.call(arguments)));
  }

  function startProviders() {
    if (enabled) return;
    enabled = true;
    if (CONFIG.debug) { log('debug mode — providers NOT loaded, events logged only'); return; }
    for (var i = 0; i < providers.length; i++) providers[i].init();
  }

  function stopProviders() {
    if (CONFIG.debug) log('consent revoked — analytics stopped');
    for (var i = 0; i < providers.length; i++) providers[i].disable();
    enabled = false;
  }

  function dispatch(method, name, params) {
    var c = readConsent();
    if (!c || !c.analytics) { log('(dropped, no consent)', method, name, params || ''); return; }
    if (!enabled) startProviders();
    if (CONFIG.debug) { log(method, name, params || ''); return; }
    for (var i = 0; i < providers.length; i++) providers[i][method](name, params);
  }

  /* ── Public singleton ──────────────────────────────────────────────────── */
  var analytics = {

    /* Core -------------------------------------------------------------- */
    pageView: function (pageName, params) { dispatch('pageView', pageName, params); },
    event: function (name, params) { dispatch('event', name, params); },

    /* Consent ------------------------------------------------------------
       setConsent(true/false) is called by the cookie banner. It persists
       the choice and starts or stops every provider accordingly.          */
    getConsent: function () { return readConsent(); },
    setConsent: function (granted) {
      writeConsent({ necessary: true, analytics: !!granted, ts: new Date().toISOString() });
      if (granted) { startProviders(); this.event('consent_granted'); }
      else stopProviders();
    },

    /* Website pages ------------------------------------------------------ */
    homepageViewed: function () { this.pageView('homepage'); },
    builderPageOpened: function () { this.pageView('builder'); },
    documentationViewed: function () { this.pageView('documentation'); },
    downloadsViewed: function () { this.pageView('downloads'); },
    founderViewed: function () { this.pageView('founder'); },

    /* Builder tabs --------------------------------------------------------
       analytics.builderOpened('empire') etc. — one event, builder as param
       so GA4 can break it down without 10 separate event names.           */
    builderOpened: function (builderName) { this.event('builder_opened', { builder: builderName }); },

    /* Project / mod actions ---------------------------------------------- */
    newProject: function () { this.event('project_new'); },
    openProject: function () { this.event('project_open'); },
    saveProject: function () { this.event('project_save'); },
    'export': function (type) { this.event('mod_export', { export_type: type || 'zip' }); },
    'import': function (type) { this.event('file_import', { import_type: type || 'vanilla' }); },
    importVanillaFile: function (kind) { this.event('file_import', { import_type: 'vanilla', file_kind: kind || '' }); },
    importExistingMod: function () { this.event('file_import', { import_type: 'mod' }); },
    validationRun: function (result) { this.event('validation_run', result ? { result: result } : {}); },

    /* Scenario generator -------------------------------------------------- */
    scenarioGenerated: function (params) { this.event('scenario_generated', params); },
    scenarioSaved: function () { this.event('scenario_saved'); },
    scenarioLoaded: function () { this.event('scenario_loaded'); },
    scenarioExported: function () { this.event('scenario_exported'); },

    /* Library -------------------------------------------------------------- */
    libraryOpened: function () { this.event('library_opened'); },
    assetSaved: function (kind) { this.event('asset_saved', kind ? { asset_kind: kind } : {}); },
    assetImported: function (kind) { this.event('asset_imported', kind ? { asset_kind: kind } : {}); },
    assetDeleted: function (kind) { this.event('asset_deleted', kind ? { asset_kind: kind } : {}); },

    /* Outbound social links ------------------------------------------------ */
    outboundClick: function (network, url) { this.event('outbound_click', { network: network, link_url: url || '' }); }
  };

  /* ── Automatic outbound-link tracking (delegated — no inline handlers) ── */
  var SOCIAL_HOSTS = [
    [/(^|\.)youtube\.com$|(^|\.)youtu\.be$/i, 'youtube'],
    [/(^|\.)discord\.(gg|com)$/i, 'discord'],
    [/(^|\.)patreon\.com$/i, 'patreon'],
    [/(^|\.)ko-fi\.com$/i, 'kofi'],
    [/(^|\.)github\.com$/i, 'github']
  ];
  document.addEventListener('click', function (e) {
    var el = e.target;
    while (el && el.tagName !== 'A') el = el.parentElement;
    if (!el || !el.href) return;
    var host;
    try { host = new URL(el.href).hostname; } catch (err) { return; }
    for (var i = 0; i < SOCIAL_HOSTS.length; i++) {
      if (SOCIAL_HOSTS[i][0].test(host)) { analytics.outboundClick(SOCIAL_HOSTS[i][1], el.href); return; }
    }
  }, true);

  /* ── Boot: apply stored consent ────────────────────────────────────────── */
  var stored = readConsent();
  if (stored && stored.analytics) startProviders();

  /* The one permitted global. */
  window.analytics = analytics;
})();
