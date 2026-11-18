import { Property, createAction } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../../auth';
import { makeClient } from '../../common';
import { aiInput, aiOutput, aiProps } from '../../common/ai-props';
import { listAccountsOutputSchema } from '../../common/output-schemas';

export const listAccountsAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_list_accounts',
	classification: 'SEARCH',
	displayName: 'List Accounts',
	description: 'Lists or searches accounts (companies).',
	audience: 'ai',
	aiMetadata: {
		description:
			'Searches accounts (CRM companies) by name, one page at a time, with their contact and deal counts. Use it to find the account ID for Update Account (AI), Associate Contact with Account (AI), Create Deal and Create Note. Read-only and safe to repeat.',
		idempotent: true,
	},
	outputSchema: listAccountsOutputSchema,
	props: {
		search: Property.ShortText({ displayName: 'Search', description: 'Part of the account name.', required: false }),
		limit: aiProps.limit,
		offset: aiProps.offset,
	},
	async run({ auth, propsValue }) {
		const { limit, offset } = aiInput.pageParams({ limit: propsValue.limit, offset: propsValue.offset });
		const page = await makeClient(auth.props).listPage({
			path: '/accounts',
			key: 'accounts',
			limit,
			offset,
			query: { search: aiInput.optionalText(propsValue.search), count_deals: 'true' },
		});
		return { ...page, items: page.items.map(aiOutput.accountSummary) };
	},
});
