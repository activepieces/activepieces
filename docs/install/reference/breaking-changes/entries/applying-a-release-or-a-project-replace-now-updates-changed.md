---
id: applying-a-release-or-a-project-replace-now-updates-changed
title: "Applying a release or a project replace now updates changed connection references"
added: '2026-09-17'
release: 0.92.0
---

Applying a release (Environments / Git Sync) or running Project Replace used to keep whatever connection the destination step already pointed at. A step whose connection changed in the source silently kept the old one, and the connection the release created for it stayed unreferenced with status `MISSING`. Two things change:

- A changed connection reference is now a change the diff sees, so a flow whose only edit is its connection is applied instead of being reported as unchanged.
- The destination's connection is kept only when the incoming step carries no connection of its own, and only when the step is still the same piece. Swapping a step to a different piece no longer grafts the old piece's connection onto it.

Connection secrets still never cross instances. Only the reference travels, and a reference to a connection that does not exist in the destination yet lands as a `MISSING` connection for someone to authorize there.

#### What you need to do

Nothing on upgrade if your source project is the source of truth for connections, which is the intended model. If instead you deliberately re-point a step in the destination project at a different connection than the source uses, that re-point is now overwritten on the next apply. Either point the source at the connection you want, or clear the connection on the source step so the destination wiring is preserved.
