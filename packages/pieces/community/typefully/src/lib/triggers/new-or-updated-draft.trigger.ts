import {
	createTrigger,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
	DedupeStrategy,
	pollingHelper,
	Polling,
	HttpMethod,
} from '@activepieces/pieces-common';
import { typefullyAuth } from '../auth';
import { typefullyApiCall } from '../common/client';
import { socialSetDropdown } from '../common/props';
import { TypefullyDraft, TypefullyPaginatedResponse } from '../common/types';

const polling: Polling<
	{ secret_text: string },
	{ social_set_id: string }
> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, propsValue, lastFetchEpochMS }) => {
		const response = await typefullyApiCall<
			TypefullyPaginatedResponse<TypefullyDraft>
		>({
			apiKey: auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/social-sets/${propsValue.social_set_id}/drafts`,
			query: {
				order_by: '-updated_at',
				limit: 50,
			},
		});

		return response.results
			.filter(
				(draft) =>
					new Date(draft.updated_at).getTime() > lastFetchEpochMS,
			)
			.map((draft) => ({
				epochMilliSeconds: new Date(draft.updated_at).getTime(),
				data: draft,
			}));
	},
};

export const newOrUpdatedDraftTrigger = createTrigger({
	auth: typefullyAuth,
	name: 'typefully_new_or_updated_draft',
	displayName: 'New or Updated Draft',
	description:
		'Triggers when a draft is created, updated, scheduled, or published in Typefully.',
	props: {
		social_set_id: socialSetDropdown,
	},
	type: TriggerStrategy.POLLING,
	sampleData: {
		id: 'draft_123',
		status: 'draft',
		title: 'My Draft',
		created_at: '2026-01-01T00:00:00Z',
		updated_at: '2026-01-01T00:00:00Z',
		published_at: null,
		scheduled_at: null,
		posts: [{ text: 'Hello world!', platforms: ['x'], media_ids: [] }],
		tags: [],
		share_url: null,
	},
	async test(context) {
		return await pollingHelper.test(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
			files: context.files,
		});
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
		return await pollingHelper.poll(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
			files: context.files,
		});
	},
});
