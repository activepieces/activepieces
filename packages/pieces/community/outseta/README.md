# Outseta (Activepieces)

This piece provides webhook triggers and lookup actions for Outseta CRM and Billing.

It is designed for event-driven workflows: react to Outseta events (accounts, people, subscriptions, payments) and enrich flows with minimal read-only API calls.

## Triggers

The piece exposes explicit event-based triggers (one trigger = one event):

- Account created
- Account updated
- Person created
- Person updated
- Subscription created
- Subscription updated
- Invoice paid
- Payment succeeded

Triggers are implemented as manual webhooks.  
Webhook URLs must be configured in the Outseta dashboard.

## Actions

Read-only lookup actions:

- Get account
- Get person
- Get subscription

## Authentication

This piece uses the Outseta Admin API.

Required credentials:
- Outseta domain (example: https://yourcompany.outseta.com)
- API Key
- API Secret

## Webhook security

Webhook signature verification is NOT implemented in v1.

Security relies on the secrecy of the webhook URL.

## Version

v0.1.0 – initial release.
