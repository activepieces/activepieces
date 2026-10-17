---
title: Default projects are a flag on the project
icon: 🏷️
status: accepted
---

# Default projects are a flag on the project

## Decision

Whether a team project is a default project is stored as `project.isDefault`, with a database check that only team projects can have it. The platform API keeps its shape: it takes `defaultProjectIds` and returns it, built from the flagged projects.

## Context

The first version stored a `defaultProjectIds` id array on `platform`. The array had no link to the project rows, so the code had to keep it in sync by hand: removing ids on every delete, a per-platform lock so a save couldn't write back a deleted id, and re-checking that each id was still a live team project on every read. Abdul raised it in review on #15972.

## Why

A flag lives on the row it describes: deleting the project takes the flag with it, `platformId` is already on the row, and the database can refuse a personal project as a default. That removed the lock and the sync code. The API can still return a list because responses don't have to mirror storage, like `GET /flows` returning a version that isn't stored on the flow. The rejected alternative was keeping the array (it matches how Slack and Discord expose default channels), at the cost of that sync code.

## Consequences

Reads are a query (`platformId`, `type = TEAM`, `isDefault`, not deleted), ordered by `created`, because an array's order is gone. Saving sets exactly the given set in one `UPDATE`. Only the platform endpoints return `defaultProjectIds` (`PlatformResponse`), so other platform reads don't pay for the query.
