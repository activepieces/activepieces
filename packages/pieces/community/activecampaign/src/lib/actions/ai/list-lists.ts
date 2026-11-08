import { Property, createAction } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../../auth';
import { makeClient } from '../../common';
import { aiInput, aiOutput, aiProps } from '../../common/ai-props';
import { listListsOutputSchema } from '../../common/output-schemas';

export const listListsAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_list_lists',
	classification: 'SEARCH',
	displayName: 'List Lists',
	description: 'Lists or searches mailing lists.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists the mailing lists, optionally filtered by name, one page at a time. Use it to find the list ID that Subscribe Contact to List, Unsubscribe Contact from List and List Contacts need. Read-only and safe to repeat.',
		idempotent: true,
	},
	outputSchema: listListsOutputSchema,
	props: {
		name: Property.ShortText({ displayName: 'Name', description: 'Filter by list name.', required: false }),
		limit: aiProps.limit,
		offset: aiProps.offset,
	},
	async run({ auth, propsValue }) {
		const { limit, offset } = aiInput.pageParams({ limit: propsValue.limit, offset: propsValue.offset });
		const page = await makeClient(auth.props).listPage({
			path: '/lists',
			key: 'lists',
			limit,
			offset,
			query: { 'filters[name]': aiInput.optionalText(propsValue.name) },
		});
		return { ...page, items: page.items.map((record) => aiOutput.idText({ record, keys: ['id', 'name', 'stringid', 'cdate'] })) };
	},
});
