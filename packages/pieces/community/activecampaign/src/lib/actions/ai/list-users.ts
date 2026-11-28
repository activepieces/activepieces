import { createAction } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../../auth';
import { makeClient } from '../../common';
import { aiOutput } from '../../common/ai-props';
import { listUsersOutputSchema } from '../../common/output-schemas';

export const listUsersAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_list_users',
	classification: 'SEARCH',
	displayName: 'List Users',
	description: 'Lists the account users.',
	audience: 'ai',
	aiMetadata: {
		description: 'Lists the ActiveCampaign users (team members) with their IDs and emails. Use it to find owner and assignee IDs for deals and tasks. Read-only and safe to repeat.',
		idempotent: true,
	},
	outputSchema: listUsersOutputSchema,
	props: {},
	async run({ auth }) {
		const all = await makeClient(auth.props).listAll({ path: '/users', key: 'users' });
		const items = all.items.map((record) => aiOutput.idText({ record, keys: ['id', 'username', 'firstName', 'lastName', 'email'] }));
		return { items, total: items.length };
	},
});
