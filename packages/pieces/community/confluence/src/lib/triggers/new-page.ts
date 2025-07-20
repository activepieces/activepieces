import {
	createTrigger,
	TriggerStrategy,
	PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, HttpMethod } from '@activepieces/pieces-common';
import { confluenceAuth } from '../../index';
import { confluenceApiCall, confluencePaginatedApiCall, PaginatedResponse } from '../common';
import { isNil } from '@activepieces/shared';
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

type Props = {
	spaceId: string;
};

const polling: Polling<PiecePropValueSchema<typeof confluenceAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS }) {
		const pages = [];
		if (lastFetchEpochMS === 0) {
			const response = await confluenceApiCall<PaginatedResponse<ConfluencePage>>({
				domain: auth.confluenceDomain,
				username: auth.username,
				password: auth.password,
				version: 'v2',
				method: HttpMethod.GET,
				resourceUri: `/spaces/${propsValue.spaceId}/pages`,
				query: {
					limit: '10',
					sort: '-created-date',
				},
			});
			if (isNil(response.results)) {
				return [];
			}
			pages.push(...response.results);
		} else {
			const response = await confluencePaginatedApiCall<ConfluencePage>({
				domain: auth.confluenceDomain,
				username: auth.username,
				password: auth.password,
				method: HttpMethod.GET,
				version: 'v2',
				resourceUri: `/spaces/${propsValue.spaceId}/pages`,
				query: {
					sort: '-created-date',
				},
			});
			if (isNil(response)) {
				return [];
			}
			pages.push(...response);
		}

		return pages.map((page) => {
			return {
				epochMilliSeconds: new Date(page.createdAt).getTime(),
				data: page,
			};
		});
	},
};

export const newPageTrigger = createTrigger({
	name: 'new-page',
	displayName: 'New Page',
	description: 'Triggers when a new page is created.',
	auth: confluenceAuth,
	type: TriggerStrategy.POLLING,
	props: {
		spaceId: spaceIdProp,
	},

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
		parentType: 'page',
		parentId: '123456',
		spaceId: 'SAMPLE123',
		ownerId: '12345678abcd',
		lastOwnerId: null,
		createdAt: '2024-01-01T12:00:00.000Z',
		authorId: '12345678abcd',
		position: 1000,
		version: {
			number: 1,
			message: 'Initial version',
			minorEdit: false,
			authorId: '12345678abcd',
			createdAt: '2024-01-01T12:00:00.000Z',
		},
		body: {},
		status: 'current',
		title: 'Sample Confluence Page',
		id: '987654321',
		_links: {
			editui: '/pages/resumedraft.action?draftId=987654321',
			webui: '/spaces/SAMPLE/pages/987654321/Sample+Confluence+Page',
			edituiv2: '/spaces/SAMPLE/pages/edit-v2/987654321',
			tinyui: '/x/abcd123',
		},
	},
});
