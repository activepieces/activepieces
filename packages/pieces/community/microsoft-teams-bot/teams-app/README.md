# Microsoft Teams Bot — Setup & Packaging

This piece sends messages to a Teams channel **as a bot** (not as a signed-in user). That requires you to register your own Azure Bot, package a Teams app, and install it into your team.

---

## Prerequisites

- An **Azure subscription** in the *same tenant* as your Teams (the **Free / F0** bot tier is $0).
- **Admin rights** in that tenant — you'll need to grant admin consent for the Graph permissions.

---

## 1. Create the Azure Bot

1. [Azure Portal](https://portal.azure.com) → **Create a resource** → **Azure Bot**.
2. **Pricing tier:** `Free (F0)`.
3. **Type of App:** `Single Tenant`.
4. **Creation type:** `Create new Microsoft App ID`.
5. Create it, then open the resource. Note the **Microsoft App ID** (this is your `botId`).

## 2. Enable the Microsoft Teams channel

Bot resource → **Channels** → add **Microsoft Teams** → accept the terms → **Apply**.

> Skipping this makes app installation fail with `BadRequest ... BulkMembershipRequest`.

## 3. Set the messaging endpoint

Bot resource → **Configuration** → **Messaging endpoint**:

```
https://<your-activepieces-url>/api/v1/teams-bot/webhook
```

e.g. `https://cloud.activepieces.com/api/v1/teams-bot/webhook`, or your tunnel URL when developing locally. This is how the bot reports where it's installed so Activepieces can post to it.

## 4. Create a client secret

App Registration (link from the bot's Configuration page) → **Certificates & secrets** → **New client secret** → copy the **Value** (not the Secret ID — the Value is shown only once).

## 5. Grant Microsoft Graph permissions

The Team and Channel dropdowns read from Microsoft Graph, so the app needs **application** permissions:

App Registration → **API permissions** → **Add a permission** → **Microsoft Graph** → **Application permissions** → add:

- `Team.ReadBasic.All`
- `Channel.ReadBasic.All`

Then click **Grant admin consent for &lt;your org&gt;**. Both must show a green ✓.

## 6. Package the Teams app

This folder contains everything you need:

- `manifest.json` — the Teams app manifest
- `color.png` — 192×192 full-color icon
- `outline.png` — 32×32 transparent outline icon

In `manifest.json`, replace the **`<TEAMS_BOT_APP_ID>`** placeholder (it appears in both `id` and `bots[0].botId`) with your **Microsoft App ID** from step 1. Then zip the three files (zip the files directly, not the folder):

```bash
cd teams-app
zip activepieces-teams-bot.zip manifest.json color.png outline.png
```

## 7. Install the app in your team

- **Sideload (dev):** Teams → **Apps** → **Manage your apps** → **Upload an app** → **Upload a custom app** → pick the zip → add it to the target **team/channel**.
- **Org-wide / production:** Teams Admin Center → **Teams apps** → **Manage apps** → **Upload new app**, or submit to the Teams Store via Partner Center.

On install, the bot receives an `installationUpdate` event and Activepieces stores where to reach it. **The bot must be installed in a team before you can post to its channels.**

## 8. Connect in Activepieces

Create a connection on the **Microsoft Teams Bot** piece with:

| Field | Value |
|-------|-------|
| **Bot App ID** | the Microsoft App ID from step 1 |
| **Bot App Secret** | the client secret **Value** from step 4 |
| **Tenant ID** | your **Directory (tenant) ID** (Entra ID → Overview) |

---

## Troubleshooting

| Symptom | Cause & fix |
|---------|-------------|
| Connection fails / dropdowns empty | Graph **application** permissions not added or admin consent not granted (step 5). Delegated permissions do **not** work here. |
| Send fails: `Authorization has been denied for this request` | The **Tenant ID** (or the bot) is a *different* tenant than your Teams. Bot and Teams must be the same tenant. |
| Install fails: `BulkMembershipRequest` | The **Microsoft Teams channel** isn't enabled on the bot (step 2). |
| Send fails: `Incorrect conversation creation parameters` | The bot isn't installed in that team, or the channel id is wrong — reinstall the app (step 7). |
| `Activepieces Bot is not installed in this team` | Install the app into the team (step 7) so the bot's endpoint gets registered. |
