---
id: telemetry-moves-from-ap-telemetry-enabled-to-the-platform
title: "Telemetry moves from `AP_TELEMETRY_ENABLED` to the platform admin UI"
added: '2026-09-07'
release: 0.90.4
---

Product analytics used to be governed only by the `AP_TELEMETRY_ENABLED` environment variable, read once when the app started. It is now a per-platform setting stored in the database, editable at **Platform → Infrastructure → Configurations**.

Upgrading does not change what you collect. Each platform's setting is created the first time it is read, taking `AP_TELEMETRY_ENABLED` as its value, so an instance running with `AP_TELEMETRY_ENABLED=false` stays opted out — on an existing install and on a brand-new one alike.

After a platform's setting exists, the environment variable no longer governs it. Editing the variable has no effect on that platform, and switching the toggle on in the UI turns product analytics on even if the variable still reads `false`.

The setting is per platform, so on an instance hosting several platforms each one is controlled separately. The page is hidden on Activepieces Cloud.

#### What you need to do

Nothing, if you want to keep collecting what you collect today, and nothing if you rely on `AP_TELEMETRY_ENABLED=false` — that value is carried into each platform's setting as it is created. What changes is that the variable becomes a starting value rather than a permanent lock: once a platform has a setting, an admin can switch product analytics on from the UI regardless of what the variable says. If that matters to you, restrict who holds platform-admin rights.
