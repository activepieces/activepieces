---
id: release-0-75-0
title: "0.75.0"
added: '2025-12-25'
release: 0.75.0
legacy: true
---

### What has changed?
- When you navigate to a flow run inside the builder the url will change to /runs, this is something embedding customers might need to consider in case they have a route guard that only allows users to navigate to /flows.
- In **development mode**, loading piece translations are now off by default. Set `AP_LOAD_TRANSLATIONS_FOR_DEV_PIECES=true` to enable.

### Do you need to take action?
- Check your embedding navigation handler and see if it would be blocking the user from seeing the runs inside the builder or not.
- If you want to load translations for pieces in development mode, set `AP_LOAD_TRANSLATIONS_FOR_DEV_PIECES=true` in your environment variables.
