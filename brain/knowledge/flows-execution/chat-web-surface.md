---
icon: 🪟
---

# Chat Web Surface

How [chat](./chat.md) lives in the web app. There is **one chat window per tab**, owned by the [app shell](../engineering/web-navigation-shell.md), and every page shares it. It moves between a side dock, a floating card, a mobile sheet and full width without remounting, so a reply keeps streaming while the user navigates. Backend, tools and billing are on the [chat](./chat.md) page.

**Session** — the conversation a tab shows. One per tab, in `useChatPanel` (`features/workspace/lib/chat-panel-open.ts`).
**Width** — where the chat sits right now: `full`, `left`, `right`, `float`, `sheet` or `closed` (`chatWidthFor` in `features/workspace/lib/chat-layout.ts`).
**Split** — a page opened beside a full-width chat: the chat folds into the left dock and the page fills the rest.
**Follow-along** — chat opening and refreshing the resource it is changing, per run.

## Shell and session

- `ChatChromeHost` (in the shell) portals `AIChatBox` into one detached DOM node marked `data-chat-root`. Each host (left or right `ChatDock`, the float card, the sheet) appends that node when it becomes active. Moving the chat moves the node; React never remounts it.
- The chat mounts on first open, or 800 ms after load as a prewarm.
- `/chat` and `/chat/:conversationId` use `shellHandles.chat` (`chat: 'full'`). The same chat then fills the left dock at 100% width and the page column is `inert`. `app/routes/chat-with-ai/index.tsx` renders nothing: it only syncs the URL id with the store, and turns a `location.state.prompt` hand-over into a new chat.
- Storage:
  - per tab (`sessionStorage`): `chat:conv` (the conversation), `chat:view` (open, split), `chat:last-page`, `chat:drafts`
  - shared (`localStorage`): `chat-panel` (dock side, float position and size, dock width), `chat:last-conv` (seeds a fresh tab)
- The socket lives in the shell too. While a reply streams, `use-streaming-reducer` holds the connection (`socketConnection.hold()`), so a project or token change reconnects only after the reply ends.

## Widths

| Viewport | Docked chat becomes |
| --- | --- |
| < 768 px | `sheet` (bottom sheet, `#chat` hash) |
| 768–959 px | `float` |
| ≥ 960 px | the saved `left` / `right` / `float` |

Dock width is clamped to 320–640 px and never leaves the page less than 760 px. Toasts move away from the chat (`useChatToastPlacement`).

## Split view and auto-open

- `chatTransitions.openBeside` opens a page next to the chat. From full width it enters split; on mobile it closes the sheet and just navigates. The history entry carries `chatSplit` / `chatSplitBack`, so Back restores the split.
- `chatTransitions.expand` returns to full width. If the split came from the full chat, it is a real `navigate(-1)`: expand equals Back.
- `FollowAlongController` decides when to open the resource the run is changing:
  - **wait** while an approval gate is open, the user types in the page, or a dialog or menu is open
  - **offer** (a pill: "{name} is ready", "Now editing {name}") when the full chat has a draft or is scrolled up, or the user has touched the page during the run. A `ready` offer opens by itself after 1.5 s idle.
  - **open** otherwise
- Leaving the target page by hand while chat edits stops following until chat starts editing again. The follow bar shows "Chat is editing…" and a Stop following button.

## Resource registry

`features/chat/lib/resources/registry.ts` maps a tool call to a `ResourceRef` (`kind`, `id`, `projectId`, `name`), an op and an outcome. Kinds: flow, table, agent, run, connection, folder, platform-settings, project-settings.

- A tool result can declare its resource in `_meta.apResource`; that wins over the hand-written `TOOLS` table.
- Outcome comes from the result (`declined`, `held`, `timeout`, `forbidden`, `failed`, `partial`, `applied`). Only `applied` and `partial` count as changes.
- `autoOpen: false` kinds (platform and project settings) never open on their own.
- A change invalidates the kind's query keys, then flashes what changed (`useAiHighlight`: flow steps, named fields). In the builder, an edit to the open step holds a "Chat updated this step" notice instead of replacing the form.
- The same records feed the per-message change summary and "Changed in this chat" (`change-summary.ts`).

## Composer and cards

- Sending while a reply streams **queues** the message; it sends when the reply ends, or returns to the composer if the reply was stopped.
- The **secret guard** flags text that looks like an API key before sending; the user can remove it or send anyway.
- Drafts are kept per conversation in `sessionStorage`.
- Each message sends the **page context** (`page-context.ts`): the resource at the current path plus a selected step or table rows. None on `/chat`.
- Cards added on this branch: `ap_request_secret` (the browser saves the secret to a connection, AI provider or secret manager and hands the model only a `{ kind, id }` reference), a settings diff on `ap_update_settings` / `ap_invite_member` approvals, `ap_open_resource` (opens a resource beside the chat), and doc sources from `ap_search_docs` / `ap_read_doc`.

## Gotchas

- **The web side is ahead of the server.** `pageContext`, `_meta.apResource` and the tools `ap_request_secret`, `ap_open_resource`, `ap_update_settings`, `ap_invite_member`, `ap_search_docs`, `ap_read_doc` appear nowhere in `packages/server` or `packages/core`. Only the demo scenarios (`features/chat/lib/demo/`: dev builds, or a tab opened with the demo URL param) exercise them.
- **A tool the registry does not know does not follow along.** A new tool that changes a resource needs a `TOOLS` entry in `registry.ts` or an `apResource` in its result. Otherwise the chat neither opens nor refreshes the page, and nothing fails.
- **Only the run you sent navigates.** Follow-along acts only for a run this tab sent (`attach: 'sent'`) in the conversation it shows. A resumed run, or a reply in another conversation, changes data but never moves the page.
- **Do not mount a second `AIChatBox` for the main chat.** The session store, follow-along and socket hold all assume one chat per tab. The agent page's own chat (`agent-chat-view.tsx`) is the only other caller.

## Key files

- `packages/web/src/app/components/app-shell.tsx` — mounts docks, float, notch and `ChatChromeHost`
- `packages/web/src/app/components/chat-panel/` — `chat-window.tsx` (hosts, widths, split binding), `chat-chrome.tsx` (header, history), `follow-along-controller.tsx`, `follow-bar.tsx`, `chat-offer-pill.tsx`
- `packages/web/src/features/workspace/lib/chat-panel-open.ts` — `useChatPanel`, `chatTransitions`
- `packages/web/src/features/workspace/lib/chat-layout.ts` — breakpoints and width rules
- `packages/web/src/features/chat/lib/resources/registry.ts`, `change-summary.ts`
- `packages/web/src/features/chat/lib/follow/` — `follow-along.ts` (per-run state), `use-ai-highlight.ts`
- `packages/web/src/features/chat/lib/page-context.ts`, `use-open-resource.ts`
- `packages/web/src/app/routes/chat-with-ai/lib/composer-utils.ts`, `secret-request.ts`
