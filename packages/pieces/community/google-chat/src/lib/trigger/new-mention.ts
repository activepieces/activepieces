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

const LAST_FETCH_TIMESTAMP_KEY = 'last_fetch_timestamp';
const AUTHENTICATED_USER_ID_KEY = 'authenticated_user_id';

// Helper function to get the current user's Chat ID
const getSelfId = async (token: string) => {
    // The People API is the standard way to get the authenticated user's ID
    const response = await httpClient.sendRequest<{ resourceName: string }>({
        method: HttpMethod.GET,
        url: `https://people.googleapis.com/v1/people/me?personFields=metadata`,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: token,
        },
    });
    // The People API resourceName is 'people/{id}', Chat uses 'users/{id}'
    const personId = response.body.resourceName.replace('people/', '');
    return `users/${personId}`;
};

export const newMention = createTrigger({
    auth: googleChatAuth,
    name: 'new_mention',
    displayName: 'New Mention',
    description: 'Fires when you are mentioned in a new message in a Google Chat space.',
    props: {
        space: googleChatCommon.space,
    },
    type: TriggerStrategy.POLLING,

    async onEnable(context) {
        const { space } = context.propsValue;

        // Store the authenticated user's ID for checking mentions
        const userId = await getSelfId(context.auth.access_token);
        await context.store.put(AUTHENTICATED_USER_ID_KEY, userId);

        // Fetch the latest message event to set the starting point
        const response = await httpClient.sendRequest<{ spaceEvents: { eventTime: string }[] }>({
            method: HttpMethod.GET,
            url: `${GCHAT_API_URL}/${space}/spaceEvents`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth.access_token,
            },
            queryParams: {
                pageSize: '1',
                filter: 'eventTypes:"google.chat.message.v1.created"',
            },
        });

        if (response.body.spaceEvents && response.body.spaceEvents.length > 0) {
            await context.store.put(LAST_FETCH_TIMESTAMP_KEY, response.body.spaceEvents[0].eventTime);
        }
    },

    async onDisable(context) {
        await context.store.delete(LAST_FETCH_TIMESTAMP_KEY);
        await context.store.delete(AUTHENTICATED_USER_ID_KEY);
    },

    async run(context) {
        const { space } = context.propsValue;
        const lastFetchTimestamp = await context.store.get<string>(LAST_FETCH_TIMESTAMP_KEY);
        const selfId = await context.store.get<string>(AUTHENTICATED_USER_ID_KEY);

        if (!lastFetchTimestamp || !selfId) return [];

        const response = await httpClient.sendRequest<{ spaceEvents: any[] }>({
            method: HttpMethod.GET,
            url: `${GCHAT_API_URL}/${space}/spaceEvents`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth.access_token,
            },
            queryParams: {
                filter: `eventTime > "${lastFetchTimestamp}" AND eventTypes:"google.chat.message.v1.created"`,
            },
        });

        const events = response.body.spaceEvents ?? [];
        const mentions = [];

        for (const event of events) {
            const message = event.payload?.message;
            const annotations = message?.annotations;
            if (!annotations) continue;

            const isMentioned = annotations.some(
                (ann: any) =>
                    ann.type === 'USER_MENTION' && ann.userMention?.user?.name === selfId
            );

            if (isMentioned) {
                mentions.push(message);
            }
        }

        if (events.length > 0) {
            const latestEventTimestamp = events[events.length - 1].eventTime;
            await context.store.put(LAST_FETCH_TIMESTAMP_KEY, latestEventTimestamp);
        }

        return mentions;
    },

    async test(context) {
        // For testing, we can't be sure the latest message is a mention.
        // We will return the latest 5 messages as sample data.
        const { space } = context.propsValue;
        
        const response = await httpClient.sendRequest<{ messages: unknown[] }>({
            method: HttpMethod.GET,
            url: `${GCHAT_API_URL}/${space}/messages`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth.access_token,
            },
            queryParams: {
                pageSize: '5',
                orderBy: 'createTime DESC',
            },
        });

        return response.body.messages ?? [];
    },

    sampleData: {
        "name": "spaces/ABCDEFG/messages/HIJKLMN.OPQRSTU",
        "sender": {
            "name": "users/123456789",
            "displayName": "Jane Doe",
            "email": "jane.doe@example.com",
            "type": "HUMAN"
        },
        "text": "Hello @Sample User, can you check this?",
        "createTime": "2025-08-15T17:14:27.000Z",
        "annotations": [
            {
                "type": "USER_MENTION",
                "startIndex": 7,
                "length": 12,
                "userMention": {
                    "user": {
                        "name": "users/0987654321",
                        "displayName": "Sample User",
                        "type": "HUMAN"
                    },
                    "type": "MENTION"
                }
            }
        ]
    }
});