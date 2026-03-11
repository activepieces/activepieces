# Klaviyo

[Klaviyo](https://www.klaviyo.com/) is a marketing automation platform specializing in email, SMS, and customer data management.

## Authentication

This piece uses a **Private API Key**. To get one:

1. Log in to your Klaviyo account
2. Go to **Account Settings → API Keys**
3. Click **Create Private API Key**
4. Copy the key (starts with `pk_`) and paste it into the connection settings

## Actions

### Profiles
- **Create Profile** – Add a new customer profile
- **Update Profile** – Update an existing profile by ID
- **Get Profile** – Retrieve a profile by ID
- **Find Profile by Email / Phone** – Look up a profile using contact info
- **Subscribe Profile** – Subscribe a profile to email or SMS
- **Unsubscribe Profile** – Suppress / unsubscribe a profile

### Lists
- **Create List** – Create a new subscriber list
- **Get List** – Retrieve a list by ID
- **Find List by Name** – Search for a list by name
- **Add Profile to List** – Add one or more profiles to a list
- **Remove Profile from List** – Remove one or more profiles from a list

### Events
- **Track Event** – Create a custom event (e.g., Placed Order, Viewed Product)

### Tags
- **Find Tag by Name** – Look up a tag by its name

### Custom API Call
Use the **Custom API Call** action to call any Klaviyo endpoint not covered by the built-in actions.

## Triggers

### New Profile
Fires when a new profile is created in your Klaviyo account (polling).

### Profile Added to List/Segment
Fires when a profile is added to a specific list or segment (polling).

## API Reference

[Klaviyo API Documentation](https://developers.klaviyo.com/en/reference) — API revision `2024-10-15`
