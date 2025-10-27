import {
    createTrigger,
    TriggerStrategy,
    PiecePropValueSchema
} from '@activepieces/pieces-framework';
import { HttpMethod, DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { zendeskSellAuth, ZendeskSellAuth as ZendeskSellAuthValue } from '../common/auth';
import { callZendeskApi } from '../common/client';

interface ZendeskNoteItem {
    data: ZendeskNote;
    meta: { type: string };
}
interface ZendeskNote {
    id: number;
    creator_id: number;
    resource_type: string;
    resource_id: number;
    content: string;
    created_at: string;
}

const polling: Polling<PiecePropValueSchema<typeof zendeskSellAuth>, Record<string, never>> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, lastFetchEpochMS }) {
		const response = await callZendeskApi<{ items: ZendeskNoteItem[] }>(
			HttpMethod.GET,
			'v2/notes',
			auth as ZendeskSellAuthValue,
			undefined,
			{
				sort_by: 'created_at:desc',
				per_page: lastFetchEpochMS === 0 ? '10' : '100',
			}
		);

		return response.body.items.map((item) => ({
			epochMilliSeconds: new Date(item.data.created_at).getTime(),
			data: item.data,
		}));
	},
};

export const newNote = createTrigger({
    auth: zendeskSellAuth,
    name: 'new_note',
    displayName: 'New Note',
    description: 'Fires when a new note is added to a record (lead, contact, deal) (polls for new records).',
    props: {},
    sampleData: {
        "id": 1,
        "creator_id": 1,
        "resource_type": "lead",
        "resource_id": 1,
        "content": "Highly important.",
        "is_important": true,
        "created_at": "2014-08-27T16:32:56Z",
        "updated_at": "2014-08-27T17:32:56Z"
    },
    type: TriggerStrategy.POLLING,

    async test(context) {
        return await pollingHelper.test(polling, context);
    },

    async onEnable(context) {
        await pollingHelper.onEnable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
    },

    async onDisable(context) {
        await pollingHelper.onDisable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
    },

    async run(context) {
        return await pollingHelper.poll(polling, context);
    },
});