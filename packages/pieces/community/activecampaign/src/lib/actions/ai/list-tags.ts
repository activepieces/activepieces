import { Property, createAction } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../../auth';
import { makeClient } from '../../common';
import { aiInput, aiOutput, aiProps } from '../../common/ai-props';
import { listTagsOutputSchema } from '../../common/output-schemas';

export const listTagsAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_list_tags',
	classification: 'SEARCH',
	displayName: 'List Tags',
	description: 'Lists or searches tags.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Searches tags by name, one page at a time. Use it to find the tag ID that Add Tag to Contact (AI), Remove Tag from Contact and List Contacts need; use Create Tag when no tag matches. Read-only and safe to repeat.',
		idempotent: true,
	},
	outputSchema: listTagsOutputSchema,
	props: {
		search: Property.ShortText({ displayName: 'Search', description: 'Part of the tag name.', required: false }),
		limit: aiProps.limit,
		offset: aiProps.offset,
	},
	async run({ auth, propsValue }) {
		const { limit, offset } = aiInput.pageParams({ limit: propsValue.limit, offset: propsValue.offset });
		const page = await makeClient(auth.props).listPage({ path: '/tags', key: 'tags', limit, offset, query: { search: aiInput.optionalText(propsValue.search) } });
		return { ...page, items: page.items.map((record) => aiOutput.idText({ record, keys: ['id', 'tag', 'tagType', 'description', 'cdate'] })) };
	},
});
