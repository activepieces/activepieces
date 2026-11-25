import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowListLiveCollectionItemsOutputSchema } from '../../../output-schemas';

export const listLiveCollectionItemsAction = createAction({
	auth: webflowAuth,
	name: 'webflow_list_live_collection_items',
	outputSchema: webflowListLiveCollectionItemsOutputSchema,
	displayName: 'List Live Collection Items',
	description: 'Lists the published items of a CMS collection as they appear on the live site.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			"Lists the live (published) items of a CMS collection with each item's id and published field data (keyed by field slug); drafts and unpublished changes are left out. Filter by exact name or slug, sort, and page with limit and offset. For the staged items, including drafts, use List Collection Items. A collection created since the last site publish returns 404 here until a site publish finishes (Publish Site returns before the publish is done; retry after a few seconds). Get the collection id from List Collections.",
		idempotent: true,
	},
	props: {
		collectionId: webflowAiProps.collectionId({ required: true }),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Return only items whose name is exactly this.',
			required: false,
		}),
		slug: Property.ShortText({
			displayName: 'Slug',
			description: 'Return only the item with this slug.',
			required: false,
		}),
		sortBy: Property.StaticDropdown({
			displayName: 'Sort By',
			description: 'Field to sort by. Defaults to the order Webflow returns.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Last Published', value: 'lastPublished' },
					{ label: 'Name', value: 'name' },
					{ label: 'Slug', value: 'slug' },
				],
			},
		}),
		sortOrder: Property.StaticDropdown({
			displayName: 'Sort Order',
			description: 'asc or desc.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Ascending', value: 'asc' },
					{ label: 'Descending', value: 'desc' },
				],
			},
		}),
		limit: webflowAiProps.limit({ required: false }),
		offset: webflowAiProps.offset({ required: false }),
	},
	async run(context) {
		const { collectionId, name, slug, sortBy, sortOrder, limit, offset } = context.propsValue;
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/v2/collections/${encodeURIComponent(collectionId)}/items/live`,
			query: {
				...(name ? { name } : {}),
				...(slug ? { slug } : {}),
				...(sortBy ? { sortBy } : {}),
				...(sortOrder ? { sortOrder } : {}),
				limit: String(limit ?? 100),
				offset: String(offset ?? 0),
			},
		});
	},
});
