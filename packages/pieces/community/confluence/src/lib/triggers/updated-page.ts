import {
	AppConnectionValueForAuthProperty,
	createTrigger,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { confluenceAuth } from '../auth';
import { confluenceApi } from '../common/api';
import { confluenceProps } from '../common/props';
import { updatedPageOutputSchema } from '../output-schemas';

const props = {
	spaceId: confluenceProps.spaceId({ required: true }),
};

const polling: Polling<
	AppConnectionValueForAuthProperty<typeof confluenceAuth>,
  { spaceId?: string }
> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue }) {
		const results = await confluenceApi.listSpacePages({
			auth,
			spaceId: propsValue.spaceId,
			sort: '-modified-date',
		});

		return results
			.filter((page) => page.version.number > 1)
			.map((page) => ({
				epochMilliSeconds: new Date(page.version.createdAt).getTime(),
				data: page,
			}));
	},
};

export const updatedPageTrigger = createTrigger({
	name: 'updated-page',
	outputSchema: updatedPageOutputSchema,
	classification: 'READ',
	displayName: 'Updated Page',
	description: 'Triggers when an existing page is updated (version > 1).',
	aiMetadata: {
		description: 'Fires when an existing page in the selected Confluence space is updated (i.e. its version advances beyond the first). Each event represents one edited page with its latest version metadata; brand-new pages (version 1) do not fire this.',
	},
	auth: confluenceAuth,
	type: TriggerStrategy.POLLING,
	props,
	async onEnable(context) {
		await pollingHelper.onEnable(polling, context);
	},
	async onDisable(context) {
		await pollingHelper.onDisable(polling, context);
	},
	async run(context) {
		return await pollingHelper.poll(polling, context);
	},
	async test(context) {
		return await pollingHelper.test(polling, context);
	},
	sampleData: {
		id: '987654321',
		status: 'current',
		title: 'Sample Confluence Page',
		spaceId: 'SAMPLE123',
		parentId: '123456',
		parentType: 'page',
		authorId: '12345678abcd',
		ownerId: '12345678abcd',
		createdAt: '2024-01-01T12:00:00.000Z',
		version: {
			number: 2,
			message: 'Edited title',
			minorEdit: false,
			authorId: '12345678abcd',
			createdAt: '2024-01-02T09:00:00.000Z',
		},
		body: {},
		_links: {
			webui: '/spaces/SAMPLE/pages/987654321/Sample+Confluence+Page',
		},
	},
});
