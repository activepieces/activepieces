# UptimeRobot Piece

Monitor your websites, APIs, and servers with UptimeRobot. Get alerted when things go down and automate your incident response workflows.

## What is UptimeRobot?

[UptimeRobot](https://uptimerobot.com/) is a website monitoring service used by over 3 million users. It checks your websites every 5 minutes (or as frequently as every 30 seconds on Pro plans) and alerts you when they go down.

This piece lets you manage your monitors and react to downtime events directly from Activepieces.

## Setup

To connect UptimeRobot to Activepieces, you need an API key:

1. Log in to your [UptimeRobot Dashboard](https://dashboard.uptimerobot.com/)
2. Click **Integrations & API** in the left sidebar
3. Scroll to the **API** section
4. Click **Show** next to your Main API Key
5. Copy the key (it starts with `u` followed by numbers and letters)
6. Paste it into the API Key field in Activepieces

## Rate limits

UptimeRobot's Free plan limits you to **10 API requests per minute**. Paid plans allow up to 5,000 req/min. Heavy workflows (polling trigger + frequent actions) may hit the Free-plan limit. Consider upgrading if you see rate-limit errors.

## Actions

| Action | Description |
|--------|-------------|
| **Get Monitors** | List all your monitors with optional filters by name, type, or status |
| **Create Monitor** | Create a new HTTP, Keyword, Ping, Port, or Heartbeat monitor |
| **Edit Monitor** | Update a monitor's name, URL, or check interval |
| **Delete Monitor** | Permanently remove a monitor |
| **Pause or Resume Monitor** | Temporarily pause or resume monitoring |

## Trigger

| Trigger | Description |
|---------|-------------|
| **Monitor Status Change** | Polling trigger. Fires when a monitor goes up or down. Poll cadence (~5 min) is controlled by the Activepieces platform admin. |

## Example Workflow

**Incident response automation:**

1. **Trigger:** Monitor Status Change (event_type = "down")
2. **Action:** Send Slack notification to #ops channel
3. **Action:** Create Jira ticket for the incident
4. **Action:** Page on-call engineer via PagerDuty

**Auto-resolve when back up:**

1. **Trigger:** Monitor Status Change (event_type = "up")
2. **Action:** Update Slack thread with recovery message
3. **Action:** Resolve Jira ticket
4. **Action:** Close PagerDuty incident

## Monitor Types

- **HTTP** — Checks if your website returns a successful HTTP response. Best for most websites and APIs.
- **Keyword** — Loads the page and checks whether a specific word is present or absent. Useful for detecting error pages that return 200 status.
- **Ping** — Sends an ICMP ping to a server or IP address.
- **Port** — Checks if a specific TCP port is open on a host.
- **Heartbeat** — Expects periodic pings from your service. Alerts if no ping received within the interval.

## API Reference

This piece uses the [UptimeRobot API v2](https://uptimerobot.com/api/). For advanced use cases, the **Custom API Call** action lets you call any endpoint directly.
