---
id: release-0-77-0
title: "0.77.0"
added: '2026-01-11'
release: 0.77.0
legacy: true
---

### What has changed?

- For Embed Plan users: the "Use a Template" dialog no longer appears when clicking the "New Flow" button.
- The `/flow-templates` API endpoints have been removed and replaced by `/templates`.
- Log size configuration has changed: `AP_MAX_FILE_SIZE_MB` no longer controls flow run logs. Use `AP_MAX_FLOW_RUN_LOG_SIZE_MB` instead.

### Do you need to take action?

- If you are on the embed plan, update your implementation to redirect users to the `/templates` page.
- Review the new endpoints documentation: [Templates API Schema](https://www.activepieces.com/docs/endpoints/templates/schema).
- If you use a custom value for `AP_MAX_FILE_SIZE_MB`, be sure to also set `AP_MAX_FLOW_RUN_LOG_SIZE_MB` accordingly.
