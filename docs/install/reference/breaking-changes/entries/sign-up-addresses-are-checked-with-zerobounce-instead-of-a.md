---
id: sign-up-addresses-are-checked-with-zerobounce-instead-of-a
title: "Sign-up addresses are checked with ZeroBounce instead of a bundled blocklist"
added: '2026-09-16'
release: 0.89.0
---

The bundled list of disposable-email domains introduced in 0.88.2 is gone. Sign-up now asks ZeroBounce about the address, on every password sign-up and on the emailed-code path only when the address has no account yet, and refuses it when ZeroBounce reports it as disposable, a spam trap, abusive, or on a global suppression list. The refusal is silent, so the response looks the same as a successful one. When ZeroBounce cannot be reached, or the key is invalid or out of credits, the address is let through and the reason is logged.

The check runs only when `AP_ZEROBOUNCE_API_KEY` is set. `AP_ALLOW_DISPOSABLE_EMAILS` is removed; the key is the switch. An instance without a key accepts throwaway addresses again, as it did before 0.88.2.

#### What you need to do

Nothing, unless you relied on the 0.88.2 blocklist to keep throwaway addresses out. To keep refusing them, create a ZeroBounce account and set `AP_ZEROBOUNCE_API_KEY` on the app container. Remove `AP_ALLOW_DISPOSABLE_EMAILS` from your configuration if you set it; it is ignored. See [Environment Variables](/install/reference/environment-variables).
