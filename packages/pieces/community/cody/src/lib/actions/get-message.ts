import { createAction, Property } from '@activepieces/pieces-framework';
import { codyAuth } from '../..';
import { codyClient } from '../common/client';

export const getMessageAction = createAction({
    auth: codyAuth,
    name: 'get_message',
    displayName: 'Get Message',
    description: 'Retrieve a single Cody message by its ID.',
    audience: 'ai',
    aiMetadata: {
        description:
            'Retrieves the details of a single Cody message by its ID. Use when you already have a specific message ID; to read a whole thread use List Messages (which returns full message objects). Resolve the message ID via List Messages. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        message_id: Property.ShortText({
            displayName: 'Message ID',
            description: 'The ID of the message to retrieve. Resolve via List Messages.',
            required: true,
        }),
        includes: Property.ShortText({
            displayName: 'Includes',
            description: 'Optional comma-separated related data to embed in the response.',
            required: false,
        }),
    },
    async run(context) {
        const { message_id, includes } = context.propsValue;
        const apiKey = context.auth;

        const queryParams: Record<string, string> = {};
        if (includes) {
            queryParams['includes'] = includes;
        }

        return await codyClient.get(apiKey, `/messages/${message_id}`, queryParams);
    },
});
