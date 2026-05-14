# Activepieces Teams App Package

## Contents

- `manifest.json` — Teams app manifest (edit `botId` before packaging)
- `color.png` — 192×192 full-color icon (add before packaging)
- `outline.png` — 32×32 transparent outline icon (add before packaging)

## Before packaging

1. Replace `<AP_TEAMS_BOT_APP_ID>` in `manifest.json` with the actual Azure Bot App ID
2. Add `color.png` (192×192 px) and `outline.png` (32×32 px) to this directory

## Create the zip

```bash
cd teams-app
zip activepieces-teams-bot.zip manifest.json color.png outline.png
```

## Install

- **Sideload (dev):** Teams Admin Center → Teams apps → Upload a custom app
- **Publish:** Microsoft Partner Center → Teams Store submission
