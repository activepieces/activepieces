# Hibira

[Hibira](https://hibira.io) is a hosted realtime service that speaks the Pusher Channels and Beams protocols: WebSocket channels, presence and push notifications.

## Actions

- **Send Event**: publish an event to up to 100 channels.
- **List Occupied Channels**, **Get Channel**, **Get Users in Presence Channel**.
- **Disconnect User**: close every connection of a signed-in user.
- **Send Push Notification to Interests / Users**, **Delete Push User**.

## Trigger

- **New Channel Event**: channel occupied/vacated, presence member added/removed, client events, subscription count, cache miss, chat message. The trigger registers its own webhook on the app and verifies each call with the app secret.

## Connection

App ID, key and secret from the app page at hibira.io/portal (the free plan is enough). Push actions also need the Push instance ID and secret key.
