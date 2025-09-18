import {
    createTrigger,
    TriggerStrategy,
    Property,
} from '@activepieces/pieces-framework';
import {
    DedupeStrategy,
    HttpMethod,
    Polling,
    pollingHelper,
} from '@activepieces/pieces-common';

import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

const props = {
    conversation_id: Property.ShortText({
        displayName: 'Conversation ID',
        description: 'The ID of the conversation to monitor.',
        required: true,
    }),
    desired_state: Property.StaticDropdown({
        displayName: 'Desired State',
        description:
            'The state to trigger on (e.g., open, archived, deleted, assigned, etc.).',
        required: true,
        options: {
            options: [
                { label: 'Open', value: 'open' },
                { label: 'Archived', value: 'archived' },
                { label: 'Deleted', value: 'deleted' },
                { label: 'Assigned', value: 'assigned' },
                { label: 'Unassigned', value: 'unassigned' },
                // Add more states as needed
            ],
        },
    }),
};

const polling: Polling<
    OAuth2PropertyValue,
    { conversation_id: string | undefined; desired_state: string | undefined }
> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
        const { conversation_id, desired_state } = propsValue;
        const conv = await makeRequest(
            auth.access_token,
            HttpMethod.GET,
            `/conversations/${conversation_id}`
        );
        const stateChangedAt = conv.updated_at
            ? Math.floor(Number(conv.updated_at) * 1000)
            : null;

        // Only emit if the state matches and it's new since last poll
        if (
            conv.status === desired_state &&
            stateChangedAt !== null &&
            (!lastFetchEpochMS || stateChangedAt > lastFetchEpochMS)
        ) {
            return [
                {
                    epochMilliSeconds: stateChangedAt,
                    data: conv,
                },
            ];
        }
        return [];
    },
};

export const newConversationStateChange = createTrigger({
    auth: frontAuth,
    name: 'newConversationStateChange',
    displayName: 'New Conversation State Change',
    description: '',
    props,
    sampleData: {
        id: 'cnv_yo1kg5q',
        subject: 'How to prank Dwight Schrute',
        status: 'assigned',
        status_id: 'sts_5x',
        status_category: 'resolved',
        created_at: 1701292649.333,
        updated_at: 1701806790.536,
    },
    type: TriggerStrategy.POLLING,

    async test(ctx) {
        return await pollingHelper.test(polling, {
            auth: ctx.auth,
            store: ctx.store,
            propsValue: ctx.propsValue,
            files: ctx.files,
        });
    },
    async onEnable(ctx) {
        await pollingHelper.onEnable(polling, {
            auth: ctx.auth,
            store: ctx.store,
            propsValue: ctx.propsValue,
        });
    },
    async onDisable(ctx) {
        await pollingHelper.onDisable(polling, {
            auth: ctx.auth,
            store: ctx.store,
            propsValue: ctx.propsValue,
        });
    },
    async run(ctx) {
        return await pollingHelper.poll(polling, ctx);
    },
});
