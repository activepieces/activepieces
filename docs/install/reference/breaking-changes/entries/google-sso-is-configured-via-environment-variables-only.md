---
id: google-sso-is-configured-via-environment-variables-only
title: "Google SSO is configured via environment variables only"
added: '2026-06-18'
order: 2
release: 0.86.0
---

"Sign in with Google" can no longer be enabled from the SSO page in the admin panel — that setting has been removed. It is now controlled solely by the `AP_GOOGLE_CLIENT_ID` and `AP_GOOGLE_CLIENT_SECRET` environment variables. The button only appears when both are set (and the platform's Google auth toggle is enabled).

#### What you need to do

Only if you set up Google SSO from the admin panel. Move your Google OAuth2 credentials into the `AP_GOOGLE_CLIENT_ID` and `AP_GOOGLE_CLIENT_SECRET` environment variables.
