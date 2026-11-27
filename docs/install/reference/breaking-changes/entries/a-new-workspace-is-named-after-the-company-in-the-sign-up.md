---
id: a-new-workspace-is-named-after-the-company-in-the-sign-up
title: "A new workspace is named after the company in the sign-up email"
added: '2026-08-24'
release: 0.89.0
---

Completing sign-up used to always name the new platform after the person, as `"Ahmad's Platform"`. It now reads the email domain first: `ahmad@activepieces.com` creates a platform called `Activepieces`, and the project alongside it becomes `Activepieces's Project`.

The person-based name is still what you get from a consumer address. `ahmad@gmail.com` continues to produce `"Ahmad's Platform"`, as do the other common providers (Outlook, Yahoo, iCloud, Proton, GMX, QQ and similar). Whether an address counts as a work address is decided by a denylist of consumer providers, so anything not on that list is treated as a company.

This only affects platforms created from here on. Existing platforms keep their names, and renaming stays available in settings.

#### What you need to do

Nothing. No configuration, no new environment variable, and nothing to migrate. If you script or test first-run sign-up and assert on the generated platform or project name, update that assertion: a work-domain address no longer yields `"<FirstName>'s Platform"`.
