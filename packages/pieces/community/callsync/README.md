# CallSync

[CallSync](https://callsyncapp.com) syncs a sales team's business calls and recordings from their Android phones, writes AI call summaries, and keeps a light CRM of contacts, tasks and notes.

## Authentication

Sign in to the [CallSync dashboard](https://dash.callsyncapp.com) as the workspace owner, open **API & Apps** and copy the API key. Integrations must be on in an active plan.

## Triggers

- **New Call**: a call syncs from a team member's phone.
- **New Call Recording**: a call recording finishes uploading.
- **Call AI Analysis Ready**: a call's transcript and AI summary are ready.
- **Contact Updated**: a contact's name, note or labels change.

Each trigger subscribes a signed webhook in CallSync when the flow is published and removes it when the flow is turned off. Deliveries with a bad signature are ignored.

## Actions

Find Calls, Get Call AI Analysis, Create Contact, Update Contact, Find Contacts, Create Task, Update Task, Find Tasks, Add Note to Contact, and Custom API Call.
