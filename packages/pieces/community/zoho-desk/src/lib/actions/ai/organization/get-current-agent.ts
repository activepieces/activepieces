import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskFindAgentByEmailOutputSchema } from '../../../output-schemas';

export const zohoDeskGetCurrentAgentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_current_agent',
	outputSchema: zohoDeskFindAgentByEmailOutputSchema,
	displayName: 'Get Current Agent',
	description: 'Gets the agent behind the connection.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets the agent the connection signs in as, with their ID, role and departments.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
	},
	async run(context) {
		const { orgId } = context.propsValue;
		return await zohoDeskApi.getCurrentAgent({ auth: context.auth, orgId });
	},
});
