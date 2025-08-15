import {
    createTrigger,
    TriggerStrategy,
    Property,
} from '@activepieces/pieces-framework';
import {
    HttpMethod,
    httpClient,
    AuthenticationType,
} from '@activepieces/pieces-common';
import { googleChatAuth } from '../..';
import { googleChatCommon, GCHAT_API_URL } from '../common';

// The key used to store the last timestamp in the trigger's state
const LAST_FETCH_TIMESTAMP_KEY = 'last_fetch_timestamp';

export const newMessage = createTrigger({
    auth: googleChatAuth,
    name: 'new_message',
    displayName: 'New Message',
    description: 'Fires when a new message is received in a Google Chat space.',
    props: {
        space: googleChatCommon.space,
    },
    type: TriggerStrategy.POLLING,

    // onEnable runs when the trigger is first turned on.
    // It fetches the most recent message to set the starting point for polling.
    async onEnable(context) {
        const { space } = context.propsValue;

        const response = await httpClient.sendRequest<{ messages: { createTime: string }[] }>({
            method: HttpMethod.GET,
            url: `${GCHAT_API_URL}/${space}/messages`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth.access_token,
            },
            queryParams: {
                pageSize: '1',
                orderBy: 'createTime DESC', // Get the newest message first
            },
        });

        if (response.body.messages && response.body.messages.length > 0) {
            const lastMessage = response.body.messages[0];
            // Store the timestamp of the very last message
            await context.store.put(LAST_FETCH_TIMESTAMP_KEY, lastMessage.createTime);
        }
    },

    // onDisable runs when the trigger is turned off.
    // We clear the stored timestamp.
    async onDisable(context) {
        await context.store.delete(LAST_FETCH_TIMESTAMP_KEY);
    },

    // run is the main polling function that checks for new messages.
    async run(context) {
        const { space } = context.propsValue;
        const lastFetchTimestamp = await context.store.get<string>(LAST_FETCH_TIMESTAMP_KEY);

        if (!lastFetchTimestamp) {
            // Should not happen after onEnable, but as a safeguard.
            return [];
        }

        const response = await httpClient.sendRequest<{ messages: { createTime: string }[] }>({
            method: HttpMethod.GET,
            url: `${GCHAT_API_URL}/${space}/messages`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth.access_token,
            },
            queryParams: {
                // Filter for messages created after the last one we saw
                filter: `createTime > "${lastFetchTimestamp}"`,
                orderBy: 'createTime ASC', // Process new messages in the order they arrived
            },
        });

        const newMessages = response.body.messages ?? [];

        if (newMessages.length > 0) {
            // Update the store with the timestamp of the newest message from this batch
            const latestMessageTimestamp = newMessages[newMessages.length - 1].createTime;
            await context.store.put(LAST_FETCH_TIMESTAMP_KEY, latestMessageTimestamp);
        }

        return newMessages;
    },

    // test is used for the "Test Trigger" button in the UI.
    // It fetches the most recent message(s) to show as a sample.
    async test(context) {
        const { space } = context.propsValue;
        
        const response = await httpClient.sendRequest<{ messages: unknown[] }>({
            method: HttpMethod.GET,
            url: `${GCHAT_API_URL}/${space}/messages`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth.access_token,
            },
            queryParams: {
                pageSize: '5', // Fetch a few sample messages
                orderBy: 'createTime DESC',
            },
        });

        return response.body.messages ?? [];
    },

    // 👇 FIX: Add the required 'sampleData' property here
    sampleData: {
        "name": "spaces/AAAAAAAAAAA/messages/BBBBBBBBBBB.BBBBBBBBBBB",
        "sender": {
            "name": "users/1234567890",
            "displayName": "Sample User",
            "avatarUrl": "https://lh3.googleusercontent.com/a/default-user=s48",
            "email": "user@example.com",
            "type": "HUMAN"
        },
        "createTime": "2025-08-15T17:14:27.000Z",
        "text": "This is a sample message!",
        "thread": {
            "name": "spaces/AAAAAAAAAAA/threads/CCCCCCCCCCC"
        }
    }
});