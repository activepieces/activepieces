import {
	AuthenticationType,
	DedupeStrategy,
	httpClient,
	HttpMethod,
	Polling,
	pollingHelper,
	QueryParams,
} from '@activepieces/pieces-common';
import { hubspotAuth } from '../../';
import {
	createTrigger,
	PiecePropValueSchema,
	Property,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';

type Props = {
	articleState: string;
};

type ListBlogPostsResponse = {
	results: Array<Record<string, any>>;
	paging?: {
		next?: {
			after: string;
		};
	};
};

const polling: Polling<PiecePropValueSchema<typeof hubspotAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS }) {
		const articleState = propsValue.articleState;
		const isTestMode = lastFetchEpochMS === 0;

		const qs: QueryParams = { limit: '100', sort: '-createdAt' };
		if (articleState !== 'BOTH') {
			qs.state = articleState;
		}
		if (!isTestMode) {
			if(articleState === 'PUBLISHED') {
                qs['publishDate__gt']=lastFetchEpochMS.toString();
            }
            else
            {
                qs['createdAt__gt']=lastFetchEpochMS.toString();
            }
		}

		const items = [];

		let after;

		do {
			const response = await httpClient.sendRequest<ListBlogPostsResponse>({
				method: HttpMethod.GET,
				url: 'https://api.hubapi.com/cms/v3/blogs/posts',
				queryParams: qs,
				authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth.access_token },
			});

			after = response.body.paging?.next?.after;
			if(response.body.paging?.next?.after){
				qs.after = response.body.paging?.next?.after;
			}
			items.push(...response.body.results);
			if (isTestMode) {
				break;
			}
		} while (after);

		return items.map((item) => {
			return {
				epochMilliSeconds: articleState === 'PUBLISHED' ? dayjs(item.publishDate).valueOf() : dayjs(item.createdAt).valueOf(),
				data: item,
			}
		});
	},
};

export const newBlogArticleTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-blog-article',
	displayName: 'New COS Blog Article',
	description: 'Triggers when a new article is added to your COS blog.',
	type: TriggerStrategy.POLLING,
	props: {
		articleState: Property.StaticDropdown({
			displayName: 'Article State',
			required: true,
			options: {
				disabled: false,
				options: [
					{
						label: 'Published Only',
						value: 'PUBLISHED',
					},
					{
						label: 'Draft Only',
						value: 'DRAFT',
					},
					{
						label: 'Both',
						value: 'BOTH',
					},
				],
			},
		}),
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
	async test(context) {
		return await pollingHelper.test(polling, context);
	},
	async run(context) {
		return await pollingHelper.poll(polling, context);
	},
	sampleData: {},
});
