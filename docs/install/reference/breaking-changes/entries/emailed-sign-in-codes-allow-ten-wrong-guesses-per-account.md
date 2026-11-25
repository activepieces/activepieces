---
id: emailed-sign-in-codes-allow-ten-wrong-guesses-per-account
title: "Emailed sign-in codes allow ten wrong guesses per account per hour"
added: '2026-08-18'
release: 0.88.2
---

The six-digit login code already allowed five wrong guesses, but that budget lived on the code itself, and the fifth wrong guess threw the code away — so asking for a new code handed out five fresh guesses immediately, with no ceiling on how often that could repeat. A six-digit code is only a million possibilities, so unlimited retries reduce it to a matter of hours.

Wrong guesses are now counted per account over a rolling hour, independently of how many codes get sent. Entering the right code clears the counter, so someone who fumbles a few digits and then succeeds is unaffected.

Two consequences worth knowing. Someone who spends ten wrong guesses on an account within an hour cannot sign in **with an emailed code** until the hour is up; password and Google sign-in are unaffected. And because the counter is keyed on the account rather than the caller, anyone who knows an address can spend that budget on the owner's behalf — a temporary nuisance for the owner, and the trade the cap is worth making.

#### What you need to do

Nothing. The limit applies out of the box and needs no configuration. If your support team sees a report of "the code keeps saying it's wrong", have them check whether the account has burned its hourly budget, and point the user at password or Google sign-in in the meantime.
