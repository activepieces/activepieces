import { createAction } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../../auth';
import { makeClient } from '../../common';
import { aiOutput } from '../../common/ai-props';
import { listPipelinesOutputSchema } from '../../common/output-schemas';

export const listPipelinesAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_list_pipelines',
	classification: 'SEARCH',
	displayName: 'List Deal Pipelines',
	description: 'Lists the deal pipelines.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists every deal pipeline with its ID, title and currency. Use it to find the pipeline ID for List Deal Stages, List Deals, Create Deal and Update Deal. Read-only and safe to repeat.',
		idempotent: true,
	},
	outputSchema: listPipelinesOutputSchema,
	props: {},
	async run({ auth }) {
		const all = await makeClient(auth.props).listAll({ path: '/dealGroups', key: 'dealGroups' });
		const items = all.items.map((record) => aiOutput.idText({ record, keys: ['id', 'title', 'currency', 'allgroups', 'autoassign'] }));
		return { items, total: items.length };
	},
});
