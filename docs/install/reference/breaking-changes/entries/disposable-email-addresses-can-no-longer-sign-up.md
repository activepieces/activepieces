---
id: disposable-email-addresses-can-no-longer-sign-up
title: "Disposable email addresses can no longer sign up"
added: '2026-08-17'
release: 0.88.2
---

Sign-up now refuses addresses from throwaway providers such as `mailinator.com` and `guerrillamail.com`, on both the emailed-code flow and the password form. Federated sign-in (Google, SAML, JWT), managed authentication and SCIM provisioning are unaffected, since those addresses come from an identity provider you already trust.

#### What you need to do

Only if your members sign up with addresses from a disposable email provider. On 0.88.2 through 0.88.4, set `AP_ALLOW_DISPOSABLE_EMAILS=true` to keep accepting them.

<Note>
Superseded in 0.89.0: the bundled blocklist was replaced by a ZeroBounce check that runs only when `AP_ZEROBOUNCE_API_KEY` is set, and `AP_ALLOW_DISPOSABLE_EMAILS` is no longer read. See the 0.89.0 entry.
</Note>
