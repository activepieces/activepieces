# 17TRACK

Cross-border e-commerce order tracking for 2900+ carriers with automatic status updates.

## Actions

Official API doc (11 endpoints): https://asset.17track.net/api/document/v2.4_zh/index.html

- **Register Trackings** — register up to 40 tracking numbers for automatic tracking by 17TRACK
- **Get Tracking Details** — get current tracking details for up to 40 registered tracking numbers
- **List Trackings** — list registered shipments with status and pagination filters
- **Get Quota** — get the current tracking and email quota counters for the account
- **Stop Trackings** — stop automatic tracking for up to 40 registered tracking numbers
- **Restart Trackings** — restart automatic tracking for up to 40 stopped tracking numbers
- **Delete Trackings** — permanently delete up to 40 registered tracking numbers
- **Push Trackings** — queue a webhook push of the latest tracking results
- **Change Carrier** — change the carrier of registered tracking numbers
- **Update Tracking Info** — update the metadata of registered tracking numbers
- **Get Realtime Tracking Details** — query a single tracking number against carriers in real time

## Authentication

API key from [17TRACK API Settings](https://api.17track.net/admin/settings). The key is sent
in the `17token` header, and is validated against the `getquota` endpoint on save.

Domain behavior (envelope check, error-code classes, response normalization) is aligned with
the open-source [OpenConnector](https://github.com/oomol-lab/open-connector) 17TRACK provider.
