# OAuth Setup for Synkra Flow

Callback URL for every provider (paste this into every console):

    https://flow.synkra.co.za/api/v1/app-connections/oauth2/callback

## Per-provider checklist

1. Register an app at the provider's developer console.
2. Set the callback URL above.
3. Copy Client ID and Client Secret.
4. Paste into Synkra Flow: Platform -> Setup -> Connections.
5. Add the piece name to the default piece set exceptions.
6. Restart app container.

## Providers

| Provider    | Console                             | Unlocks                          |
|-------------|-------------------------------------|----------------------------------|
| Google      | console.cloud.google.com            | Gmail, Drive, Sheets, Docs, Cal  |
| Microsoft   | portal.azure.com                    | Teams, OneDrive, Outlook         |
| Slack       | api.slack.com/apps                  | Slack                            |
| Shopify     | partners.shopify.com                | Shopify                          |
| Zoho        | api-console.zoho.com                | Zoho CRM, Zoho Books             |
| Pipedrive   | pipedrive.com/developer             | Pipedrive                        |
| HubSpot     | developers.hubspot.com              | HubSpot                          |
| Salesforce  | developer.salesforce.com            | Salesforce                       |
| Monday      | monday.com/apps                     | Monday                           |
| Asana       | app.asana.com/0/my-apps             | Asana                            |
| Trello      | trello.com/power-ups                | Trello                           |
| Jira        | developer.atlassian.com             | Jira                             |
| ClickUp     | clickup.com/developers              | ClickUp                          |
| Dropbox     | dropbox.com/developers              | Dropbox                          |
| Calendly    | developer.calendly.com              | Calendly                         |
| GitHub      | github.com/settings/developers      | GitHub                           |
| GitLab      | gitlab.com/-/profile/applications   | GitLab                           |
| QuickBooks  | developer.intuit.com                | QuickBooks                       |
| Discord     | discord.com/developers              | Discord                          |

## Scope notes

- Google: one GCP project, enable Gmail API + Drive API + Sheets API +
  Calendar API. One OAuth app covers all four pieces.
- Microsoft: one Azure app registration, add Graph delegated permissions
  for Teams, Files, Mail.
- Slack: needs `channels:read`, `chat:write`, `files:write`, `users:read`,
  plus the Events API subscribed to the callback URL.

## Test procedure

1. Create a new flow.
2. Add the piece.
3. Click Connect -> OAuth popup -> sign in -> approve.
4. Connection should show green.
5. Run the flow once.
6. Confirm History shows the run.
