# Guide: HTTP fallback when no connection exists

Load this when a piece connection is unavailable and the user cannot or declines to create one. Use the HTTP piece (`@activepieces/piece-http`, action `send_request`) as a direct replacement. If the user declines the HTTP fallback too, report the limitation and stop.

1. Identify the API endpoint from the app/action name (e.g. `gmail` → Gmail API, `slack` → Slack API).
2. Ask the user for their auth credentials (this is the one place a card is fine — a direct request for a specific value):
   - OAuth2 apps → ask for a Bearer Token (from the service's developer console).
   - API Key apps → ask for the API key.
   - Basic Auth apps → ask for username and password.
3. Build the request with `ap_execute_action`:
   - **pieceName**: `@activepieces/piece-http`
   - **actionName**: `send_request`
   - **input**: `{ method, url, headers, body, authentication }` matching the original action's API call.
   - No connectionExternalId needed.
4. For automation builds, use the HTTP piece step with the same inline auth pattern.

Always explain plainly: "Since we don't have a [App] connection set up, I'll call the [Service] API directly."
