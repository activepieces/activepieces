---
status: accepted
---

# Default projects apply to new members only, and removing one revokes nothing

## Decision

A default project is an onboarding rule, not an access rule. When a user is created on a platform they join every default project as Editor. Adding a project to the list does not add existing members, and removing it does not remove anyone.

## Context

Turning personal projects off stranded people arriving by SSO, SCIM or open sign-up with no project. Default projects fix that. Four models were weighed: new members only; public projects (access computed, no membership rows); a synced list that backfills and revokes; and new members only plus an opt-in one-time backfill.

## Why

New-members-only solves the stranding problem with one hook at user creation and never grants or removes access for existing people behind the admin's back. Public projects would change every access check and allow only one role for everyone. A synced list needs to record how each membership was granted, and makes mass grants and revokes a side effect of a setting.

## Consequences

"Include current members" would be a separate, explicit, confirmed action, not the list's behaviour. "Everyone can see this project" is a different feature (public projects) and must not reuse `defaultProjectIds`.
