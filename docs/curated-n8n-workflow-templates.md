# Curated n8n Workflow Templates Added to Activepieces

This document summarizes the 10 n8n-inspired workflow templates added to the Activepieces template catalog. The source inspiration is [Zie619/n8n-workflows](https://github.com/Zie619/n8n-workflows), which describes itself as a large collection of production-ready n8n workflows.

These templates were selected because they map to common automation jobs, use integrations already represented in the Activepieces ecosystem, and are not duplicates of the current Activepieces official template names.

| Template | Source Inspiration | Why It Is Useful |
| --- | --- | --- |
| Capture Typeform Leads in HubSpot and Slack | `workflows/Manual/0117_Manual_Uplead_Import_Triggered.json` | Form leads are high-intent and time-sensitive. This template moves each lead into CRM and alerts sales immediately, reducing manual copy/paste and slow response times. |
| Save Gmail Attachments to Google Drive and Sheets | `workflows/Emailreadimap/1050_Emailreadimap_Send.json` | Teams often receive invoices, contracts, resumes, and support files by email. This creates a searchable Drive archive and a spreadsheet audit trail. |
| Create GitHub Issues From Slack Requests | `workflows/Webhook/0644_Webhook_Slack_Create_Webhook.json` | Engineering requests often start in Slack. Turning them into GitHub issues keeps work visible, prioritized, and traceable. |
| Send RSS Digest to Telegram | `workflows/Rssfeedread/0188_Rssfeedread_Telegram_Create_Scheduled.json` | Teams can monitor news, changelogs, status pages, or competitor updates without manually checking many websites. |
| Alert on Failed Stripe Payments | `workflows/Http/1773_HTTP_Stripe_Sync_Webhook.json` | Failed payments directly affect revenue. A fast Slack or email alert helps billing and customer success recover accounts quickly. |
| Create Notion Tasks From Important Gmail | `workflows/Stickynote/0378_Stickynote_Notion_Automate_Webhook.json` | Important emails become tasks instead of staying buried in an inbox. This is useful for founders, support teams, and operations teams. |
| Notify Discord When Airtable Records Change | `workflows/Discord/0360_Discord_Cron_Automation_Scheduled.json` | Airtable is often used as an operations database. Discord notifications help communities and internal teams react to changes quickly. |
| Send Daily Google Calendar Agenda to Slack | `workflows/Googlecalendar/0783_GoogleCalendar_Schedule_Create_Scheduled.json` | A daily agenda gives teams meeting context before the day starts and reduces missed meetings or last-minute context switching. |
| Log Shopify Paid Orders in Google Sheets | `workflows/Shopify/0961_Shopify_Filter_Create_Triggered.json` | Ecommerce teams commonly use spreadsheets for lightweight finance, fulfillment, and daily sales reporting. |
| Escalate Zendesk Tickets to Microsoft Teams | `workflows/Shopify/0268_Shopify_Zendesk_Create_Triggered.json` | High-priority support tickets should reach the right people quickly. This turns urgent customer issues into team-visible escalation alerts. |

The implementation keeps these as curated official templates in the API layer instead of importing raw n8n JSON. Activepieces templates require Activepieces flow objects and piece references, so each template was represented using Activepieces triggers/actions and placeholder connection inputs that users can configure after import.
