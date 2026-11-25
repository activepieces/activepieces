---
id: release-0-73-0
title: "0.73.0"
added: '2025-12-10'
release: 0.73.0
legacy: true
---

### What has changed?
- Major change to MCP: [Read the announcement.](https://community.activepieces.com/t/mcp-update-easier-faster-and-more-secure/11177)
- If you have SMTP configured in the platform admin, it's no longer supported—you need to use AP_SMTP_ [environment variables.](https://www.activepieces.com/docs/install/reference/environment-variables#email-smtp)

### Do you need to take action?
- If you are currently using MCP, review the linked announcement for important migration details and upgrade guidance.
- If you are below 0.73.0 and plan to switch `AP_EDITION` from `ce` to `ee`, upgrade to 0.73.0 on your current edition first, then switch. Edition-gated migrations are recorded as run without executing, so switching earlier leaves the schema incomplete.
