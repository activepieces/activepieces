---
id: the-microsoft-teams-bot-piece-no-longer-needs-a-server-side
title: "The Microsoft Teams Bot piece no longer needs a server-side installation record"
added: '2026-08-25'
release: 0.89.0
---

`POST /v1/teams-bot/webhook` and `POST /v1/teams-bot/send` are removed, and the `teams_bot_installation` table is dropped. The webhook existed only to capture Microsoft's per-tenant `serviceUrl` at install time so the send endpoint could look it up.

The piece now posts to Microsoft's documented global Teams service endpoint directly, so it holds no server-side state and its messaging endpoint moves to the shared app-webhooks route, `/api/v1/app-events/microsoft-teams-bot`. Because the installed-or-not check is no longer a cached row, it is answered by Microsoft at send time: posting to a team the bot is not a member of now fails with `403 The bot is not part of the conversation roster` instead of a stale local lookup.

The piece is published as `0.1.0` with a minimum supported release of `0.88.4`, so releases below `0.88.4` keep being offered `0.0.2`, which still has the server route it depends on.

#### What you need to do

Nothing for existing connections; they keep working untouched, and sending no longer reads the dropped table.

If you already have a flow using **Microsoft Teams Bot** piece version `0.0.2`, open the step and upgrade the piece to `0.1.0`. Flow steps pin an exact piece version, so an existing step stays on `0.0.2` after you upgrade, and `0.0.2` calls the `/v1/teams-bot/send` route this release removes. That step will fail with a 404 until it is upgraded.

Optionally repoint the **Messaging endpoint** on your Azure Bot resource from `/api/v1/teams-bot/webhook` to `/api/v1/app-events/microsoft-teams-bot`; an endpoint left on the old path returns 404 and is otherwise harmless. If you call `/v1/teams-bot/send` directly from your own code, switch to the piece's **Send Channel Message as Bot** action.
