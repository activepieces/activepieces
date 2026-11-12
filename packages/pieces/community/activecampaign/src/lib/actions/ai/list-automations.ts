import { createAction } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../../auth';
import { makeClient } from '../../common';
import { aiInput, aiOutput, aiProps } from '../../common/ai-props';
import { listAutomationsOutputSchema } from '../../common/output-schemas';

export const listAutomationsAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_list_automations',
	classification: 'SEARCH',
	displayName: 'List Automations',
	description: 'Lists the automations.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists automations with their ID, name, status and entry counts, one page at a time. Use it to find the automation ID for Add Contact to Automation and Remove Contact from Automation. Read-only and safe to repeat.',
		idempotent: true,
	},
	outputSchema: listAutomationsOutputSchema,
	props: {
		limit: aiProps.limit,
		offset: aiProps.offset,
	},
	async run({ auth, propsValue }) {
		const { limit, offset } = aiInput.pageParams({ limit: propsValue.limit, offset: propsValue.offset });
		const page = await makeClient(auth.props).listPage({ path: '/automations', key: 'automations', limit, offset });
		return { ...page, items: page.items.map((record) => aiOutput.idText({ record, keys: ['id', 'name', 'status', 'entered', 'exited', 'cdate', 'mdate'] })) };
	},
});
