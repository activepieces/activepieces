import { createTrigger, TriggerStrategy, Property, PieceAuth } from '@activepieces/pieces-framework';
import { FacebookWebhookPayload } from '../common/facebook-messenger-types';
import { WebhookHandshakeStrategy } from '@activepieces/shared';
const markdown = `
## Facebook Messenger Setup Guide
\n
### Step 1: Get Your Facebook Page Access Token

1. Go to [Facebook Developer Portal](https://developers.facebook.com/)
2. Select your app from the dashboard
3. Under "Products" in the left sidebar, click on "Messenger" > "Messenger API Settings"
4. Scroll down to the "Access Tokens" section
5. Connect your Facebook page if not already connected
6. Click "Generate Token" and confirm when prompted
7. Copy the generated token - this is your Page Access Token
8. Paste the token into the **Page Access Token** field in AutomationX
\n
### Step 2: Set Up Facebook Messenger Webhook

1. Still in Messenger API Settings, scroll to 'Webhooks' section
2. Click "Add Callback URL"
3. For the **Callback URL**, paste: \n
   **\`{{webhookUrl}}/sync\`** \n
4. For Verify Token, enter the same value you set in the field below
5. Publish your AutomationX flow first, then click "Verify and Save" in Facebook
6. Under webhook subscriptions, select : 'messages' and 'messaging_postbacks'
7. Click "Save" to complete the webhook setup

> **Note:** Make sure you use the same Verify Token value in both Facebook's webhook setup and in this trigger's configuration.
`;

export const newMessage = createTrigger({
    name: 'new-message',
    displayName: 'New Message',
    description: 'Triggers when a new message is received in Facebook Messenger',
    auth: PieceAuth.None(),
    props: {
        md: Property.MarkDown({
            value: markdown,
        }),
        verify_token: Property.ShortText({
          displayName: 'Verify Token',
          description: 'The verification token you set in the Facebook webhook settings',
          required: true,
        }),
    },
    sampleData: {
        object: 'page',
        entry: [
            {
                id: '12345678',
                time: 1677825199103,
                messaging: [
                    {
                        sender: { id: '1234567890' },
                        recipient: { id: '0987654321' },
                        timestamp: 1677825198832,
                        message: {
                            mid: 'mid.$cAAJsODHV7jRqnxuYglm4lMdx4Qy-',
                            text: 'Hello world!'
                        }
                    }
                ]
            }
        ]
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable() {
        console.log("facebook-messenger new-message action onEnable called")
    },
    async onDisable() {
        console.log("facebook-messenger new-message action onDisable called")
    },
    handshakeConfiguration: {
        strategy: WebhookHandshakeStrategy.QUERY_PRESENT,
        paramName: 'hub.challenge',
    },
    async onHandshake(context) {
        const payload = context.payload;

        // Get verification parameters from Facebook
        const mode = payload.queryParams['hub.mode'];
        const token = payload.queryParams['hub.verify_token'];
        const challenge = payload.queryParams['hub.challenge'];

        // Verify the token against the one provided in the trigger props
        if (mode === 'subscribe' && token === context.propsValue.verify_token) {
            console.log('WEBHOOK_VERIFIED');
            return {
                status: 200,
                body: challenge,
                headers: { "Content-Type": "text/plain" }
            };
        } else {
            console.log('Webhook verification failed');
            return {
                status: 403,
                body: 'Verification failed',
                headers: { "Content-Type": "text/plain" }
            };
        }
    },
    async run(context) {
        const body = context.payload.body as FacebookWebhookPayload;
        if (!body || body.object !== 'page') {
            return [];
        }

        const messages = [];

        try {
            // Get the most recent timestamp we've processed
            const lastTimestamp = Number(await context.store.get<string>('last_processed_timestamp')) || 0;
            let newestTimestamp = lastTimestamp;

            // Process each entry and messaging event
            for (const entry of body.entry) {
                if (entry.messaging) {
                    for (const messagingEvent of entry.messaging) {
                        // Only process if the message has a newer timestamp
                        if (
                            messagingEvent.message &&
                            messagingEvent.timestamp &&
                            messagingEvent.timestamp > lastTimestamp
                        ) {
                            // Add to output array
                            messages.push({
                                sender: messagingEvent.sender,
                                recipient: messagingEvent.recipient,
                                timestamp: messagingEvent.timestamp,
                                message: messagingEvent.message
                            });

                            // Track the newest timestamp we've seen
                            if (messagingEvent.timestamp > newestTimestamp) {
                                newestTimestamp = messagingEvent.timestamp;
                            }
                        }
                    }
                }
            }

            // Store the newest timestamp for future deduplication
            if (newestTimestamp > lastTimestamp) {
                await context.store.put('last_processed_timestamp', newestTimestamp.toString());
            }

            console.log(`Processed ${messages.length} new messages`);
            return messages;
        } catch (error) {
            console.error('Error processing Facebook messages:', error);
            return [];
        }
    }
});
