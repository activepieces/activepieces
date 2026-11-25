---
id: release-0-33-0
title: "0.33.0"
added: '2025-12-10'
release: 0.33.0
legacy: true
---

### What has changed?

- Files from actions or triggers are now stored in the database / S3 to support retries from certain steps, and the size of files from actions is now subject to the limit of `AP_MAX_FILE_SIZE_MB`.
- Files in triggers were previously passed as base64 encoded strings; now they are passed as file paths in the database / S3. Paused flows that have triggers from version 0.29.0 or earlier will no longer work.

### When is action necessary?
- If you are dealing with large files in the actions, consider increasing the `AP_MAX_FILE_SIZE_MB` to a higher value, and make sure the storage system (database/S3) has enough capacity for the files.
