import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowListCollectionItemsOutputSchema } from '../../../output-schemas';

export const listCollectionItemsAction = createAction({
	auth: webflowAuth,
	name: 'webflow_list_collection_items',
	outputSchema: webflowListCollectionItemsOutputSchema,
	displayName: 'List Collection Items',
	description: 'Lists the staged (draft and published) items of a CMS collection.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			"Lists the staged items of a CMS collection, including drafts, with each item's id, field data (keyed by field slug) and draft, archived and publish state. Filter by exact name or slug, sort, and page with limit and offset. For only what is live on the site use List Live Collection Items. Get the collection id from List Collections.",
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
			path: `/v2/collections/${encodeURIComponent(collectionId)}/items`,
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
