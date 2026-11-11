import { createAction } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../../auth';
import { makeClient } from '../../common';
import { aiOutput } from '../../common/ai-props';
import { listTaskTypesOutputSchema } from '../../common/output-schemas';

export const listTaskTypesAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_list_task_types',
	classification: 'SEARCH',
	displayName: 'List Task Types',
	description: 'Lists the task types.',
	audience: 'ai',
	aiMetadata: {
		description: 'Lists the task types (such as Call or Email) with their IDs. Create Task needs one. Read-only and safe to repeat.',
		idempotent: true,
	},
	outputSchema: listTaskTypesOutputSchema,
	props: {},
	async run({ auth }) {
		const all = await makeClient(auth.props).listAll({ path: '/dealTasktypes', key: 'dealTasktypes' });
		const items = all.items.map((record) => aiOutput.idText({ record, keys: ['id', 'title'] }));
		return { items, total: items.length };
	},
});
