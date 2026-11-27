---
id: one-time-codes-are-no-longer-stored-in-a-readable-form
title: "One-time codes are no longer stored in a readable form"
added: '2026-08-18'
release: 0.88.2
---

The `otp` table used to hold the six-digit sign-in code as plain text, so anyone who could read the database — a replica, a backup, a support query — could sign in as any account for the ten minutes that code was alive, without a password. Codes are now stored as a digest keyed with a server-held secret, so reading the table no longer yields anything you can sign in with. The code itself is held only long enough to re-send it if the person asks for it again.

A code found to be expired is thrown away when it is next presented, rather than sitting in the table until the same person happens to request another one.

#### What you need to do

Nothing, and no new configuration: the key is derived from a secret your instance already has. Codes written by an older build are recorded as such and keep working until they expire, so a sign-in already underway when you deploy still completes, an email verification link still opens, and a rolling deploy where both builds are serving at once behaves the same.

Rolling back costs at most the codes issued after the deploy: the older build cannot read those, so whoever holds one asks for a fresh code. Nothing is rewritten and nothing is deleted, so no cleanup is needed either way.
