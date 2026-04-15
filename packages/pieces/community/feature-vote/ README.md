# FeaturesVote Piece

## Overview

The FeaturesVote piece integrates [FeaturesVote](https://features.vote/) — a product feedback and feature voting platform — with Activepieces. It allows you to manage feature requests, update statuses, create releases, and automate workflows based on new feature submissions.

## Authentication

This piece uses an **API Key** for authentication.

**How to get your API Key:**

1. Go to your [FeaturesVote](https://features.vote/) project.
2. Navigate to **Settings** → **API Keys**.
3. Click **Create API Key** and copy it — it is only shown once.
4. Requires a **Growth** or **VIP** subscription plan.

API keys start with `fv_live_` and carry full admin privileges. Keep them secret.

## Actions

### Create Feature

Create a new feature request on your voting board.

- **Title** (required) — The feature request title.
- **Description** (optional) — Detailed description.
- **Status** (optional) — Initial status: Pending, Approved, In Progress, Done, or Rejected.
- **Tags** (optional) — Tags to categorize the feature.

### List Features

List and filter feature requests from your board.

- **Status** (optional) — Filter by status.
- **Tag** (optional) — Filter by tag name.
- **Search** (optional) — Search in title and description.
- **Limit** (optional) — Items per page (default: 50, max: 100).

### Update Feature Status

Change a feature's status and automatically notify subscribers.

- **Feature ID** (required) — The ID of the feature (from List Features).
- **New Status** (required) — The status to set.

### Create Release

Create a new release on your changelog, optionally linking completed features.

- **Version** (required) — Version number (e.g. "1.2.0").
- **Title** (required) — Release title.
- **Short Description** (optional) — Brief summary.
- **Long Description** (optional) — Full release notes in Markdown.
- **Feature IDs** (optional) — Link features to this release.
- **Draft** (optional) — Hide from public changelog.

### Custom API Call

Make any API request to the FeaturesVote REST API for endpoints not covered above.

## Triggers

### New Feature Request

Fires when a new feature request is created on your board. Polls every 5 minutes.

## Example Use Cases

- **Triage workflow:** New Feature Request trigger → check tags → route to the right team channel in Slack.
- **Status sync:** Update a Jira ticket → Update Feature Status to "In Progress" in FeaturesVote.
- **Release automation:** Create Release in FeaturesVote → send changelog email → post to Discord.