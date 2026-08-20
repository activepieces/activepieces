---
status: accepted
---

# Deleting an agent is refused while a live flow version references it

## Decision

`agentService.delete` and `agentService.unpublish` both refuse while any flow in the project references the agent from its published
version or its current draft, and the check runs inside the `DELETE` statement rather than before it.
That is as far as the delete side goes. The remaining window — a flow edit that commits the reference
after the delete's statement snapshot — is accepted, not closed, and the complete fix belongs on the
publish path: validating agent references inside the publish transaction with `SELECT … FOR SHARE` on
the referenced `agent` rows.

## Context

A flow step stores a saved agent's `externalId` and the server resolves its published config at run
start. Deleting an agent a flow still runs would break that flow's next run, so the delete is guarded.
Review escalated three times, each time correctly, as each guard closed a narrower window:
check-then-delete, then publish-after-snapshot, then flow-edit-after-snapshot.

## Why

The offending reference does not exist when the `DELETE` looks at it, so no snapshot, lock or
isolation level on the delete side can see it. Even SERIALIZABLE would not help, because
`LOCK_AND_PUBLISH` never reads the `agent` row and so raises no read-write conflict. Only the writer
of the reference can catch it.

Closing it there is a real piece of work rather than a line: `flow.service.ts` and
`flow-version.service.ts` are Community-edition code and `ee/agent/agent-service.ts` is Enterprise, so
CE must not import it — publish-side validation needs a `hooksFactory.create<T>(ceDefault)` seam with
the EE implementation registered in the `app.ts` edition switch, the shape `project-hooks.ts` uses.
The rejected alternative was an advisory lock shared by the delete and every flow-version save; a lock
on the hot flow-save path is disproportionate to the risk it removes.

The residual is bounded and loud. Hitting it needs a flow edit and an agent delete to interleave
within one statement's duration, and the outcome is one refused run with a message naming the cause —
no partial execution, no wrong tool, no data loss. A run also only accepts an agent its own stored
flow version names, so a resolved template or a trigger payload cannot introduce a reference the
guard never saw.

## Consequences

- Deleting an agent that a draft still mentions is refused, so removing the step comes first. Old
  superseded versions never block, or an agent would be undeletable forever.
- `unpublish` carries the same guard as `delete`, because it produces the same outcome for a linked
  flow: the next run is refused. Guarding only the destructive path would have been a speed bump.
- Until publish-side validation lands, publishing a draft whose agent was deleted succeeds, and the
  failure surfaces on the next run rather than at publish time.
- The guard reads `flow_version.agentIds`, and that is only trustworthy because a run refuses any
  agent the running step's own stored input does not name. The two rules hold each other up.
- The run check is per step, and the step comes from the waitpoint being resumed rather than from the
  request, since `agentIds` flattens every step's reference and a body-supplied step name is caller
  controlled. It is a narrowing, not a boundary: see the note below.
- What the run check does **not** defend against: a party that can already run code in the project.
  An engine token is scoped to a project, not to a run, and the sibling endpoint that creates
  waitpoints takes `flowRunId` and `stepName` from its body outright, so naming another pending
  waitpoint of the same project is within the engine trust model as it stands. That grants nothing new,
  because the same party can put any agent's externalId on a step of their own — flow save does not
  validate that the author may use the agent it references. Both routes need the same fix, and it is
  authoring-time validation, not a further run-time check.
