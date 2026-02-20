# WhatsApp Notifications by Syncmate

Send WhatsApp messages, group notifications, and channel updates using the Syncmate API.

## Features

- **Send Message**: Send a WhatsApp message to a specific phone number.
- **Send to Group**: Send a message to a WhatsApp group (requires Group ID).
- **Send to Channel**: Send a message to a WhatsApp channel or newsletter (requires Channel ID).
- **Media Support**: improved support for sending multiple media attachments (images, PDFs, etc.) with messages.

## Authentication

To use this piece, you need an API Key from Assistro.

1.  Log in to your [Assistro account](https://app.assistro.co).
2.  Go to the **Configuration** page.
3.  Enable the **Pabbly Add-on**.
4.  Copy the generated API Key.

## Actions

### 1. Send WhatsApp Message To Number
Sends a text message (with optional media) to a private phone number.
- **Phone Number**: Number with country code (e.g., `+91878XXXX789`).
- **Media**: (Optional) Add base64-encoded files.

### 2. Send WhatsApp Message To Group
Sends a message to a group.
- **Group ID**: The unique ID of the group (e.g., `123456789@g.us`).
- **How to find Group ID**: [View Guide](https://assistro.co/user-guide/zapier/how-to-send-message-to-a-whatsapp-group-guide-to-fetch-group-id/)

### 3. Send WhatsApp Message To Channel/Newsletter
Sends a generic update to a broadcast channel.
- **Channel ID**: The unique ID of the newsletter (e.g., `123456789@newsletter`).
- **How to find Channel ID**: [View Guide](https://assistro.co/user-guide/zapier/how-to-send-message-to-a-whatsapp-channel-guide-to-fetch-newsletter-channel-id/)

## License
MIT
