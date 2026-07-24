import { createAction, Property } from '@activepieces/pieces-framework';
import { codyAuth } from '../..';
import { codyClient } from '../common/client';
import { listBotsOutputSchema } from '../output-schemas';

export const listBotsAction = createAction({
    auth: codyAuth,
    name: 'list_bots',
    displayName: 'List Bots',
    description: 'List or search the bots in the Cody workspace.',
    audience: 'ai',
    aiMetadata: {
        description:
            'Lists the bots in the Cody workspace, optionally filtered by a name keyword (case-insensitive partial match). This is the primary resolver: bots are read-only and can only be created in the Cody web UI (there is no create-bot API), so this is the only way to obtain a bot ID for Create Conversation. Read-only and safe to retry.',
        idempotent: true,
    },
    outputSchema: listBotsOutputSchema,
    props: {
        keyword: Property.ShortText({
            displayName: 'Keyword',
            description:
                'Optional name keyword to filter bots by (case-insensitive partial match). Omit to list all bots.',
            required: false,
        }),
    },
    async run(context) {
        const { keyword } = context.propsValue;
        const apiKey = context.auth;

        const bots = await codyClient.listBots(apiKey, keyword);

        return {
            bots,
            count: bots.length,
        };
    },
});
