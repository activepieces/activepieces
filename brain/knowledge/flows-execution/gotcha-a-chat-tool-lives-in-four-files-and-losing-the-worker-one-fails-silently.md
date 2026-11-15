---
icon: 🪄
---

# Gotcha: a chat tool lives in four files, and losing the worker one fails silently

A [chat](./chat.md) tool is not defined in one place. `ap_remember` is the full set:

| File | Role |
| --- | --- |
| `worker/.../ee/chat/chat-worker-tools.ts` | the `tool({ description, inputSchema, execute })` entry handed to `streamText` — **the only thing that makes the tool callable** |
| `api/.../ee/chat/tools/chat-tools.ts` | the `executeTool` switch case that does the work |
| `api/.../ee/chat/chat-rpc-handlers.ts` | the system prompt telling the model to call it |
| `web/.../chat-with-ai/lib/message-blocks.ts` | how the call renders in the UI |

Delete only the worker entry and **nothing fails loudly**: it compiles, lint passes, no test covers
it, and the API handler still exists. The model is simply told to call a tool that is no longer in
its tool set, so it silently can't — the user's "remember that I…" is acknowledged and dropped. The
only signal is a memory eval regressing.

This happened on `feat/flowless-action-runs`: `chat-worker-tools.ts` was carried over verbatim from
an abandoned earlier branch whose last commit predated the `ap_remember` PR (#14375) by three hours,
so the file arrived as a clean revert with no merge conflict to notice. Detection recipe when a
feature branch touches a hot shared file — compare the branch's blob against the merge base, not
just eyeball the intended change:

```bash
git diff <merge-base> <branch-commit> -- <file>   # must show ONLY your intended change
```

When adding or moving a chat tool, grep all four files for the tool name and confirm each hit is
still wired. Tool name strings are the only linkage between the layers; there is no shared registry
to typecheck against.
