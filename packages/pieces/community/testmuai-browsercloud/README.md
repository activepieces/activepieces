# TestMu AI (Formerly LambdaTest)

Launch and drive real cloud browsers on [TestMu AI](https://www.testmuai.com) (formerly LambdaTest) infrastructure — directly from an Activepieces flow or an AI agent. No local browser required.

The piece speaks the W3C WebDriver protocol to the TestMu AI hub and exposes a small, agent-friendly action set built around a **page snapshot** model: instead of writing brittle CSS/XPath selectors, you get a numbered list of interactive elements (each with a `ref`) and act on them by number.

## Authentication

Uses your TestMu AI (LambdaTest) **Username**, **Access Key**, and **Region** (`us` or `eu`). A session is bound to the region that created it, so keep the region consistent across a flow.

## Actions

| Action | Description |
| --- | --- |
| Create Session | Start a cloud browser and return a `sessionId` used by every other action. |
| Navigate | Open a URL, then return a fresh snapshot of the page. |
| Snapshot Page | Re-scan the current page and return its interactive elements (each with a `ref`). |
| Click Element | Click an element by its `ref`. Returns a fresh snapshot. |
| Type Text | Type into an element by its `ref`, optionally pressing Enter. Returns a fresh snapshot. |
| Get Text | Read visible text from one element (by `ref`) or the whole page body. |
| Take Screenshot | Capture the current viewport as a PNG file. |
| Execute Script | Run JavaScript in the page and return its result. |
| Release Session | End the session and free its resources. Always run this when finished. |

## Typical flow

1. **Create Session** → keep the returned `sessionId`.
2. **Navigate** to a URL → read the snapshot to find element `ref`s.
3. **Click** / **Type** using those `ref`s (each returns a fresh snapshot).
4. **Get Text** / **Take Screenshot** to extract results.
5. **Release Session** when done.

## Notes for AI agents

Every action is exposed as a tool (`audience: 'both'`) with an `aiMetadata` description. Read-only actions (Snapshot Page, Get Text, Take Screenshot) are marked `idempotent`. Mutating actions (Navigate, Click, Type) return a fresh snapshot so the agent can observe the result before acting again.
