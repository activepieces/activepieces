# Systeme.io Piece for Activepieces

## Overview
This piece enables seamless integration with Systeme.io’s marketing platform, allowing you to automate workflows for contacts, sales, and tags using Activepieces.

## Features
- **Triggers:**
  - New Contact
  - New Sale
  - New Tag Added to Contact
- **Actions:**
  - Create Contact
  - Update Contact
  - Add Tag to Contact
  - Remove Tag from Contact
  - Find Contact by Email

## Setup
1. Sign up for a Systeme.io account: https://systeme.io
2. Generate an API Key from your Systeme.io dashboard (Profile > Public API keys).
3. Use the API Key in the Activepieces piece authentication.

## Authentication
- Uses API Key authentication via the `X-API-Key` header.

## Triggers
- **New Contact:** Fires when a new contact is created.
- **New Sale:** Fires when a new sale is made in a funnel.
- **New Tag Added to Contact:** Fires when a specific tag is assigned to a contact.

## Actions
- **Create Contact:** Create a new contact with email, name, and optional tags.
- **Update Contact:** Update fields of an existing contact.
- **Add Tag to Contact:** Assign a tag to an existing contact.
- **Remove Tag from Contact:** Remove a tag from an existing contact.
- **Find Contact by Email:** Locate a contact by their email address.

## Error Handling
- Handles rate-limiting (`429`) and invalid API key (`401`) errors gracefully.

## Example Use Cases
- Automate welcome emails for new contacts.
- Tag webinar attendees automatically.
- Update CRM records when a sale is made.

## Contribution
- Follow the [Activepieces Piece Development Guidelines](https://www.activepieces.com/docs/developers/building-pieces/overview).
- Submit your piece following the contribution process. 