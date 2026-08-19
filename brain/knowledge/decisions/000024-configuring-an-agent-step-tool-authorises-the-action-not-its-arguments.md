---
title: Configuring an agent step's tool authorises the action, not its arguments
icon: 🔓
status: accepted
---

An agent flow step runs unattended. Before this, that meant it could not write at all: a
`FLOW_STEP` run starts permanently tainted, so `requiresActionPreview` sends every action
that is not provably read-only to the approval gate, and `waitForApproval` auto-declines
for any non-chat run. The gate was the whole control.

Piece actions the flow author attaches to the step are exempt from that gate. Applying it
would decline the tools the author deliberately configured, which is the entire feature.
The line drawn: **choosing an action on the step authorises that action.** The gate remains
for actions the agent discovers at runtime, which is what taint was added for.

## What that does and does not authorise

It authorises the piece and the action, plus any field the author pinned
(`FieldControlMode.CHOOSE_YOURSELF` / `LEAVE_EMPTY`, enforced server-side in
`piece-input-plan.ts`, not merely in the prompt).

It does **not** authorise the arguments. The step's instruction is model-authored and
normally carries trigger data, so every unpinned field, including recipients and targets,
is chosen by a model from input an attacker may control. The default in the builder is
`AGENT_DECIDE`, so an author who configures a tool and pins nothing has authorised that
action's full capability surface.

## Controls this decision made necessary

Each of these exists only because the gate is gone, and each was found by red-teaming the
decision rather than the code:

- **Model-written values cannot carry `{{ }}`.** The engine resolves templates in *every*
  step input, not just `auth`, so an authorised `send_message` would otherwise let the
  model put `{{connections['prod-stripe']}}` in the body and have the engine splice in the
  decrypted secret. Neutralised in `piece-input-filler.ts`. Use a lookahead, not
  `replaceAll` — the latter is walked through with `{{{`, because it resumes after each
  match and the emitted brace re-pairs with the untouched one.
- **Pinned values are applied after the model's answer.** Relying on the strict schema is
  not enough: `recoverFencedJson` parses fenced output with a bare `JSON.parse` and no zod.
- **`custom_api_call` is allowed on a step, but only as a path.** It was refused outright at
  first, on the belief that the model chose the whole URL. Reading only
  `joinBaseUrlWithRelativePath` in `pieces/common/src/lib/helpers/index.ts` seemed to disprove
  that, since the piece fixes the host from its own auth. Both readings were wrong: its caller
  at `:363` uses the value verbatim when it starts with `http://` or `https://`, and
  `authMapping` still attaches the connection's credentials, so an absolute URL sends them to a
  host the model picked. The action is allowed and an absolute URL is refused server-side
  before the call, which keeps the real capability &mdash; other endpoints of the same API &mdash;
  and closes the escape. Trace a helper's callers before concluding what a value can be.

- **A tool is capped per turn**, because nothing else bounds how often one turn fires an
  action, and chat's email tool already had two such limits.
- **The resolved input is logged.** It was computed, redacted and discarded, and the adhoc
  flow holding it is deleted, so an incident showed that an email went out but not to whom.

## Revisit when

The durable fix is an explicit per-tool "allow unattended" flag the author sets, so the
decision is theirs rather than implied by attaching a tool. That needs a builder change.
Until it exists, the write/read split rests on `agentToolClassification`, which is
word-matching on the action name, and the configured-tool path does not consult it at all.
