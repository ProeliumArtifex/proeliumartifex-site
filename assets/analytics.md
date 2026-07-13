# Proelium Artifex — Analytics

Provider-independent analytics for the site and the Stellaris Mod Builder.
Two files, one global singleton, nothing loads before consent.

## Files

| File | Purpose |
|---|---|
| `assets/analytics-providers.js` | Provider classes: `AnalyticsProvider` (base), `GoogleAnalyticsProvider`, `MicrosoftClarityProvider`. Must load **before** analytics.js. |
| `assets/analytics.js` | Config, consent handling, the `analytics` singleton with all wrapper methods, automatic outbound-link tracking. |
| `assets/analytics.md` | This document. |

Site pages include both scripts with a relative path, e.g.:

```html
<script src="assets/analytics-providers.js"></script>
<script src="assets/analytics.js"></script>
```

**Exception — the mod builder app** (`gaming/tools/stellaris-mod-builder.html` and the dev
copies in the Stellaris Mod Builder folder) embeds both files **inline** so it stays a
single self-contained file that works from disk. If you change analytics.js or
analytics-providers.js, re-embed the new contents into the app's
`// ══ PA ANALYTICS` script section.

## Where the IDs go

Both live in the `CONFIG` block at the top of `analytics.js`:

```js
gaMeasurementId: 'G-D0KM0CB2Q4',   // GA4: Admin → Data streams → Main Site
clarityProjectId: '',              // Clarity: clarity.microsoft.com → project → Settings
```

`clarityProjectId` is currently empty — the Clarity provider stays dormant (its
`isConfigured()` returns false) until you paste a real Project ID. No other change needed.

## How consent works

- Consent is stored in the `pa_consent` cookie (mirrored to localStorage), written by
  `analytics.setConsent(true|false)` — the cookie banner calls this.
- **Nothing loads until consent**: providers are only initialised after
  `setConsent(true)`, or on page load if a stored consent already grants analytics.
- **Revoking stops tracking immediately**: `setConsent(false)` calls every provider's
  `disable()` — GA sets the official `window['ga-disable-<ID>']` opt-out flag and purges
  its cookies; Clarity calls `clarity('stop')`.
- Events fired without consent are silently dropped (logged in debug mode).

## How to disable analytics

- **Per visitor**: reject analytics cookies in the banner (footer → Privacy & Cookies).
- **Site-wide**: set `gaMeasurementId: ''` and `clarityProjectId: ''` in CONFIG — both
  providers become unconfigured and never load. Or remove the two script tags.

## Debug mode

When debug is on, every call is `console.log`ged (gold `[analytics]` prefix) and **nothing
is sent** — providers are never loaded. It is automatic on `localhost`, `127.0.0.1` and
`file:` URLs, so working on a local copy never pollutes real data. Force it on a live
page from the console:

```js
localStorage.setItem('pa_analytics_debug', '1');  // force on   ('0' forces off)
location.reload();
```

## Using the API

The rest of the codebase must never call `gtag()` or `clarity()` directly — only the
singleton:

```js
analytics.pageView('homepage');
analytics.event('anything_custom', { detail: 42 });

analytics.builderOpened('empire');       // any builder/tab name
analytics.newProject();  analytics.openProject();  analytics.saveProject();
analytics.export('zip');                 // mod exported
analytics.import('vanilla');             // file imported
analytics.validationRun();
analytics.scenarioGenerated();  analytics.scenarioSaved();
analytics.scenarioLoaded();     analytics.scenarioExported();
analytics.libraryOpened();
analytics.assetSaved('planet'); analytics.assetImported('system'); analytics.assetDeleted('mod');
analytics.outboundClick('youtube', url); // usually automatic, see below
```

Clicks on links to YouTube, Discord, Patreon, Ko-fi and GitHub are tracked automatically
by a delegated document-level listener — no inline handlers, no per-link code.

## Adding a new event

1. Prefer an existing wrapper (most take a param, e.g. `builderOpened(name)`).
2. Otherwise add a one-line method to the singleton in `analytics.js`:
   ```js
   tutorialCompleted: function (step) { this.event('tutorial_completed', { step: step }); },
   ```
3. Call it from the app. GA4 event names: lowercase snake_case, ≤40 chars.

## Adding a new provider

1. In `analytics-providers.js`, subclass the base:
   ```js
   function PlausibleProvider(config){ AnalyticsProvider.call(this, config); }
   PlausibleProvider.prototype = Object.create(AnalyticsProvider.prototype);
   // implement: isConfigured(), init(), pageView(), event(), disable()
   ```
   and add it to the `window.__paProviders` handoff object.
2. In `analytics.js`, add its config key to `CONFIG` and push an instance in the
   Providers section.

Nothing else changes — consent gating, debug mode and every wrapper method work for the
new provider automatically.

## Event reference (what's wired where)

| Event | Params | Fired from |
|---|---|---|
| `page_view` | `page_name` | every page (`homepage`, `consultancy`, `gaming`, `cookies`, `privacy`, `terms`, `mod-builder-landing`, `mod-builder-app`) |
| `builder_opened` | `builder` (tab id) | mod builder, on every tab change |
| `library_opened` | — | mod builder, Library tab |
| `project_new` / `project_open` / `project_save` | — | createPkg / project switcher / Save Project |
| `mod_export` | `export_type` | doZip (mod zip download) |
| `file_import` | `import_type`, `file_kind` | import modal |
| `validation_run` | `result` | first validate() per session |
| `scenario_generated/saved/loaded/exported` | — | Scenario Builder |
| `asset_saved` / `asset_deleted` | `asset_kind` | Library save/delete actions |
| `outbound_click` | `network`, `link_url` | automatic on social links |
| `consent_granted` | — | when the visitor accepts analytics |
