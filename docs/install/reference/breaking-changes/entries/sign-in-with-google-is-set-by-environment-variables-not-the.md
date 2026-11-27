---
id: sign-in-with-google-is-set-by-environment-variables-not-the
title: "Sign in with Google is set by environment variables, not the SSO page"
added: '2026-05-12'
order: 3
release: 0.84.0
---

"Sign in with Google" can no longer be enabled from the SSO page in the admin panel — that setting has been removed. It is now controlled solely by the `AP_GOOGLE_CLIENT_ID` and `AP_GOOGLE_CLIENT_SECRET` environment variables. The button only appears when both are set (and the platform's Google auth toggle is enabled).

#### What you need to do

Only if you set up Google SSO from the admin panel. Move your Google OAuth2 credentials into the `AP_GOOGLE_CLIENT_ID` and `AP_GOOGLE_CLIENT_SECRET` environment variables.
