---
icon: 🔄
---

# Draft Refresh

How an open builder tab takes a change that a different writer saved to the same flow draft. Every Draft Write sends a Draft Push to the project room, and each open tab that shows the newest version refreshes the draft in place. Why there is no edit lease: [decision 000050](../decisions/000050-lost-flow-edits-are-fixed-by-a-draft-refresh-not-an-edit-lease.md).

**Draft Write** — a write that changes the content of a flow draft: every step, branch, trigger and note operation, `CHANGE_NAME`, `IMPORT_FLOW`, `USE_AS_DRAFT`, `SAVE_SAMPLE_DATA`, `UPDATE_SAMPLE_DATA_INFO`, `LOCK_FLOW`, `LOCK_AND_PUBLISH` and approval withdraw. Status, folder, owner, minutes-saved and metadata writes are not Draft Writes, and neither is the schema migration on read.

**Draft Push** — the socket event `FLOW_DRAFT_UPDATED { flowId, editorSessionId }` that the server sends to the project room after each Draft Write commits. It carries no draft content.

**Draft Refresh** — a builder tab replaces its copy of the draft with the server draft, in place, with no page reload. It keeps the selected step and the open sidebar, and the selected branch while the router's branches stay the same. _Avoid_: "sync" (git sync), "reload" (a full page reload).

**Editor Session** — one page load of the web app (a builder tab, a window or an embedded builder; a reload makes a new one). Its id (`x-ap-editor-session-id`) is a label so that a tab skips the push of its own save, and it names the owner of a Resource Lock. The server keeps it only when it is an `ApId` (anything else becomes `null`) and never checks who sent it.

**Resource Lock** — the lock of a flow or a table that one Editor Session of one user holds (`lockService`, `LOCK_RESOURCE`, `useResourceLock`): acquire on mount, renew every 30 s, Take Over. _Avoid_: "Edit Lease" (the dropped design), "flow lock"; "lock" alone means a published version (`FlowVersionState.LOCKED`).

**API Writer** — a caller that writes a flow draft through the HTTP API outside the builder: an API key, or a script or embed host with a user token. Its push has `editorSessionId: null`.

**System Writer** — a server process that writes a flow for no person: project release (git pull, copy, rollback), project replace, the connection "Replace", the piece upgrade and the Deno migration. Its push has `editorSessionId: null`.

## Gotchas

- **A tab refreshes only while it shows the newest version** (`showsNewestVersion()`): no run, and the version is a DRAFT, or it is both `flow.version` and `flow.publishedVersionId`. A run view and an older version from the version history never change. A pending approval version is LOCKED but not published, so it does not count.
- **A refresh that brings a version awaiting approval makes the tab read-only**, as a reload does. The refresh can only add read-only: `readonly` also holds the permission and the Resource Lock. A Take Over or a freed Resource Lock makes the tab editable only while it shows the newest version.
- **"Edit flow" and Take Over share one path**, `flowCanvasHooks.useOpenDraft`. A run view goes to the flow page. The newest version gets a Draft Refresh, keeps the open step, and becomes editable for a person with WRITE_FLOW. An older version switches to the draft and selects the first invalid step. On both paths a version awaiting approval stays read-only. The path decides from `run` in the store, not from the URL, because embed mounts a memory router.
- **A refresh never applies over a pending edit.** `refreshDraft()` flushes the debounce, drains the save queue, then sends `GET /v1/flows/:id`. When the response finds a new pending edit, the tab waits for a pause in the typing and fetches again. `refreshDraft()` is coalesced: one run plus one shared queued run, and every caller of one run gets the same answer.
- **The open step form remounts only when its step changed.** The form key holds `draftRefreshCount`, which goes up only when the selected step's type, display name, skip or settings (without `sampleData`, compared after `prune`) changed. A piece step whose input the server cleans remounts once, at the first Draft Refresh after the person's own save.
- **A refresh clears the selected branch when the router's branches changed.** The router forms find a branch by its position, and a branch has no id. After a different writer deletes or moves a branch, the same position holds a different branch, so the panel goes back to the router settings.
- **A refresh refetches the test data of each step whose `sampleData` settings changed**, output and input, because the store keeps test data apart from the flow version. It sets the data only while the step still shows those settings, and a failed fetch keeps the shown data with no toast.
- **Publish refetches the draft first when a save failed and no Draft Refresh applied since** (`refreshDraftAfterFailedSave`). The refresh after a failed save does not retry, so in an outage the builder can keep showing an edit that the server never got. Publish stops when this refetch fails too, so it never publishes a draft that differs from what the builder showed.
- **A note editor remounts only when a Draft Refresh changes its text.** `NoteContent` keeps its own copy of the note, so the note node keys it by `noteRefreshCounts[noteId]`, which `applyDraftRefresh` raises only for a note whose content changed. That is how a note shows the saved text after its save failed, and how it shows another tab's edit.
- **The server sends `RESOURCE_UNLOCKED` to the sender too.** A tab must never release the Resource Lock in reaction to its own failure, or two tabs loop. So after a failed refresh, a flow tab that took a freed lock keeps it and stays read-only.
- **Only the flow builder acquires a freed Resource Lock.** `useResourceLock({ onLockFreed })` sends `LOCK_RESOURCE` on `RESOURCE_UNLOCKED`, refreshes, then clears the banner. Tables keep the defaults: the banner clears and nothing is acquired.
- **The Resource Lock is per Editor Session, not per user.** A second tab of the same user, or a second person on a shared account, shows "Open for editing in another tab or window" and stays read-only until Take Over. The owner is the same user with the same session, or a side with no session, so a tab from before the deploy still renews. The server never sends a session to the client: `RESOURCE_LOCKED` skips the sender's socket, so a lock event of the tab's own user always comes from another tab.
- **A closing tab releases only the lock of its own session.** Before, the disconnect handler released by user, so closing one tab freed the lock that a second tab of that user held. A reload makes a new session, so the new tab waits until the old socket's disconnect frees the lock; after a crash or a sleep that is up to 60 s, or a Take Over.
- **A leaving flow builder releases its Resource Lock only after its pending edits are saved** (`useResourceLock({ beforeRelease })`). With an unlock at unmount, the next holder refreshed before the last save committed and became editable on the older draft. A late release is skipped when the same resource mounted again in that page. A tab close, a reload or a socket drop still frees the lock at once (the server's disconnect handler), so the race stays there.
- **A lock that arrives after the builder left is released.** Each acquire (the first one, a freed lock, Take Over) remembers its mount. When its answer comes after that mount ended, the hook sends `UNLOCK_RESOURCE`, unless a newer mount of the same resource in the page holds the lock. Before, the lock stayed held, and an expired lock tells no one, so other tabs kept the banner.
- **The push goes out also with `emitEvents: false`**, so a project release and a project replace reach open tabs. A push that throws logs one error line and the save still succeeds.
- **The web client sends the Editor Session header only to the Activepieces API**, never to a third-party URL such as the npm registry lookup.
- **Every socket `connect` refreshes, the first one of a page load too.** The page loads the flow over HTTP before the socket joins the project room, so a save in that gap sends a push that the tab never gets. The builder also refreshes once when it mounts while the socket is already connected: the route loads the flow and its sample data before the builder mounts and listens, and a push in that gap reaches no listener. The cost is one more `GET` per builder open.
- **`SocketProvider` removes only its own socket listeners.** Its cleanup used to call `socket.off('connect')` with no handler, which removed every `connect` listener, the reconnect refresh included, when its effect ran again for a new `token` or `projectId`. Pass the handler to `off`.
- **Known gaps:** the accepted same-step race (see the decision); a tab that misses a push (socket drop, deploy) catches up on reconnect or on return; an API Writer that writes from an older read still wins.

## Key files

- `packages/web/src/app/builder/state/` — the store actions `refreshDraft`, `applyDraftRefresh`, `showsNewestVersion`
- `packages/web/src/app/builder/flow-canvas/` — `flowCanvasHooks.useRefreshDraftOnPush`, `useRefreshDraftOnReconnectAndReturn`, `useOpenDraft`, `useFlowLock`
- `packages/web/src/hooks/` — `useResourceLock`, with the `onLockFreed` and `beforeRelease` options
- `packages/web/src/lib/` — `editorSession`, `KeyedDebounce`, `PromiseQueue`
- `packages/server/api/src/app/flows/flow/` — `flowSideEffects(log).onDraftWritten`, the one push helper
