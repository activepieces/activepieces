---
title: A default project can't be deleted while it is a default
icon: 🛡️
status: accepted
---

# A default project can't be deleted while it is a default

## Decision

Deleting a project from the app is refused while it is in the platform's default projects; the admin removes it from the defaults on Roles & Access first. API-key calls and SCIM still delete it and drop it from the list, and so does the app on a plan without project roles, where defaults are not in effect.

## Context

Default projects used to never block anything: deleting one quietly removed it from the list. A planned auto-provisioning rule will require a default project or personal projects on before people can join an organization automatically.

## Why

If deleting a default silently removed it, an admin could empty the defaults without ever seeing that rule, so the guard would be easy to walk around. Making removal an explicit step on Roles & Access keeps the decision where the rule will live. Refusing API-key deletes too was rejected for now: existing scripts delete projects that happen to be defaults, and breaking them is not worth it before the rule exists.

## Consequences

The Projects page skips default projects when deleting and says why, with a link to Roles & Access. When auto-provisioning lands, the guard can extend to API keys behind the same check, `assertProjectIsNotADefaultProject`.
