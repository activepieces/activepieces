---
id: release-0-35-1
title: "0.35.1"
added: '2025-12-10'
release: 0.35.1
legacy: true
---

### What has changed?

- The 'name' attribute has been renamed to 'externalId' in the `AppConnection` entity.
- The 'displayName' attribute has been added to the `AppConnection` entity.

### When is action necessary?
- If you are using the connections API, you should update the `name` attribute to `externalId` and add the `displayName` attribute.
