import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../..';
import { webflowProps } from '../common/props';
import { WebflowApiClient } from '../common/client';

export const webflowFindCollectionItem = createAction({
	auth: webflowAuth,
	name: 'find_collection_item',
	classification: 'SEARCH',
	description: 'Finds collection items whose field matches a value exactly.',
	displayName: 'Find Collection Item by Field',
	audience: 'both',
	aiMetadata: { description: 'Searches a Webflow CMS collection for items whose given field name exactly matches the supplied value, optionally capped by a max-results limit. Use to look up an item by a known field value (e.g. slug or name) before reading or updating it. Read-only and idempotent. Note: matching is an exact equality filter applied client-side over the fetched items, not a fuzzy or paginated server search.', idempotent: true },
	propertyGroups: [
		{ key: 'source', display: 'section', label: 'Search In', icon: 'inbox', props: ['site_id', 'collection_id'] },
		{ key: 'match', display: 'section', label: 'Match', icon: 'filter', props: ['field_name', 'field_value'] },
	],
	props: {
		site_id: webflowProps.site_id,
		collection_id: webflowProps.collection_id,
		field_name: Property.ShortText({
			displayName: 'Field Name',
			description: "The field's API slug, not its display name.",
			placeholder: 'name',
			required: true,
			width: 'half',
		}),
		field_value: Property.ShortText({
			displayName: 'Field Value',
			description: 'Items whose field equals this exactly are returned.',
			placeholder: 'My first post',
			required: true,
			width: 'half',
		}),
		max_results: Property.Number({
			displayName: 'Max Results',
			description: 'Leave empty to return every match.',
			required: false,
			advanced: true,
		}),
	},

	async run(configValue) {
		const collectionId = configValue.propsValue['collection_id'];
		const fieldName = configValue.propsValue['field_name'];
		const fieldValue = configValue.propsValue['field_value'];
		const maxResults = configValue.propsValue['max_results'];

		const client = new WebflowApiClient(configValue.auth.access_token);

		try {
			const matches = await collectMatchingItems({ client, collectionId, fieldName, fieldValue, maxResults });

			return { success: true, result: matches.slice(0, maxResults ?? undefined) };
		} catch (err) {
			return { success: false, message: err };
		}
	},
});

async function collectMatchingItems({
	client,
	collectionId,
	fieldName,
	fieldValue,
	maxResults,
}: CollectMatchingItemsParams): Promise<WebflowCollectionItem[]> {
	if (maxResults === 0) {
		return [];
	}
	const limit = typeof maxResults === 'number' && maxResults > 0 ? maxResults : undefined;
	let matches: WebflowCollectionItem[] = [];
	let offset = 0;
	let hasMore = true;

	while (hasMore) {
		const page: WebflowCollectionItemsPage = await client.listCollectionItems(collectionId, offset, ITEMS_PAGE_SIZE);
		const items = page.items ?? [];
		const pageMatches = items.filter((item) => itemFieldEquals({ item, fieldName, fieldValue }));
		matches = [...matches, ...pageMatches];
		offset += ITEMS_PAGE_SIZE;
		hasMore = items.length === ITEMS_PAGE_SIZE && (limit === undefined || matches.length < limit);
	}

	return matches;
}

function itemFieldEquals({ item, fieldName, fieldValue }: ItemFieldEqualsParams): boolean {
	const value = item.fields?.[fieldName] ?? item[fieldName];
	return value !== undefined && value !== null && String(value) === fieldValue;
}

const ITEMS_PAGE_SIZE = 100;

type WebflowCollectionItem = {
	fields?: Record<string, unknown>;
	[key: string]: unknown;
};

type WebflowCollectionItemsPage = {
	items?: WebflowCollectionItem[];
};

type CollectMatchingItemsParams = {
	client: WebflowApiClient;
	collectionId: string;
	fieldName: string;
	fieldValue: string;
	maxResults: number | undefined | null;
};

type ItemFieldEqualsParams = {
	item: WebflowCollectionItem;
	fieldName: string;
	fieldValue: string;
};
