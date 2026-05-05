import {
	createTrigger,
	TriggerStrategy,
	AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';
import { confluenceAuth, confluenceAuthValue } from '../auth';
import { confluenceApiCall, PaginatedResponse } from '../common';
import { spaceIdProp } from '../common/props';

interface ConfluencePage {
	id: string;
	status: string;
	title: string;
	spaceId: string;
	createdAt: string;
	version: {
		number: number;
		createdAt: string;
	};
}

const props = {
	spaceId: spaceIdProp,
};

const PAGE_FETCH_LIMIT = 100;

const polling: Polling<
  confluenceAuthValue,
  { spaceId?: string }
> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue }) {
		const response = await confluenceApiCall<PaginatedResponse<ConfluencePage>>({
			domain: auth.props.confluenceDomain,
			username: auth.props.username,
			password: auth.props.password,
			version: 'v2',
			method: HttpMethod.GET,
			resourceUri: `/spaces/${propsValue.spaceId}/pages`,
			query: {
				limit: String(PAGE_FETCH_LIMIT),
				sort: '-modified-date',
			},
		});

		if (isNil(response.results)) return [];

		return response.results
			.filter((page) => page.version.number > 1)
			.map((page) => ({
				epochMilliSeconds: new Date(page.version.createdAt).getTime(),
				data: page,
			}));
	},
};

export const updatedPageTrigger = createTrigger({
	name: 'updated-page',
	displayName: 'Updated Page',
	description: 'Triggers when an existing page is updated (version > 1).',
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
