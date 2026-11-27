---
id: sign-in-and-sign-up-are-one-screen-and-an-emailed-code-signs
title: "Sign-in and sign-up are one screen, and an emailed code signs people in wherever SMTP is configured"
added: '2026-09-01'
release: 0.88.2
---

`/sign-in` and `/sign-up` now render the same card, and `/sign-up` redirects to `/sign-in` carrying its query string, so existing links — invitation URLs included — keep working.

The card's primary path is a six-digit code emailed to the address typed into it. It is offered whenever the instance has SMTP configured and email auth is enabled, on every edition including Community, so a self-hosted instance that already sends transactional email gains a way to sign in that needs no password. An instance with no SMTP is unaffected: the card opens directly on the classic password form, with Google and SAML above it exactly as before.

Two things change on an instance that does have SMTP. Password sign-in moves behind a **Use password** link on the card, and password sign-*up* is offered only where the card is in sign-up mode — the first account on a fresh instance, or an invitation link (`/sign-up?email=…`) — so someone who simply opens `/sign-in` on an instance that already has accounts is given the emailed code and no way to switch to a password sign-up form. Existing passwords are untouched: a verified identity keeps its password, and signing in with a code does not discard it.

Who may get in does not change, and the existing guards all run before a code is sent. Joining still requires `AP_ALLOW_OPEN_SIGN_UP=true`, an accepted invitation, or existing membership, and that refusal is silent — the response is identical to an accepted one and no code is sent, so the endpoint reveals nothing about who has an account. A platform's allowed-domains list still applies too, but it answers with an explicit domain-not-allowed error rather than silently, and like the platform's Email-auth setting it is inert on Community and on any platform whose plan does not include SSO. On a fresh install, before the first platform exists, there is no platform for either check to run against and both are skipped.

#### What you need to do

Nothing to configure or migrate, and no new environment variable: emailed-code sign-in turns itself on once SMTP is configured and Email is enabled as an authentication method.

If you do not want emailed-code sign-in, turn off **Email** as an authentication method for the platform (Enterprise and Cloud, under SSO settings, and only where your plan includes SSO); that disables password sign-in along with it, since both are the same method. On Community that toggle is inert, so the only lever there is leaving SMTP unconfigured.

If you script or end-to-end test the sign-in screen, re-check it: the same URL now renders a different form depending on whether SMTP is configured and whether any account exists yet. Password reset moved inside the card wherever the emailed-code path is active; an instance without SMTP still sends people to `/forget-password`, and Community shows no reset control at all.
