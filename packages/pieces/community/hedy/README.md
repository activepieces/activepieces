# Hedy Piece for ActivePieces

AI-powered meeting intelligence integration for ActivePieces.

## Features
- Retrieve meeting sessions, highlights, todos, and topics from Hedy.
- Trigger flows when sessions end, highlights are created, or todos are exported.
- Support for pagination and Zapier-compatible response formatting.
- Optional webhook signature verification for additional security.

## Authentication
1. Sign in to your Hedy dashboard.
2. Navigate to **Settings → API**.
3. Generate a new API key (it starts with `hedy_live_`).
4. Paste the key into the Hedy piece connection in ActivePieces.

## Example Automations
- **Post Session Recaps** – Trigger on `Session Ended` and send meeting notes to Slack, Microsoft Teams, or email.
- **Sync Todos** – When a todo is exported from Hedy, automatically create matching tasks in Asana, Todoist, or ClickUp.
- **Daily Digest** – Schedule a flow that lists sessions from the last 24 hours, summarises them with AI, and emails the highlights to your team.

## Error Handling
The Hedy piece provides descriptive errors for common issues such as:
- Invalid API keys or failed authentication.
- Webhook limits being reached (Hedy allows 10 concurrent webhooks per workspace).
- Invalid webhook URLs (public HTTPS endpoints are required for production).

## Support
- Hedy API documentation: https://api.hedy.bot/docs
- Hedy support: support@hedy.bot
- ActivePieces community: https://www.activepieces.com/discord
