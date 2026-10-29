import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskFindAgentByEmailOutputSchema } from '../../../output-schemas';

export const zohoDeskGetAgentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_agent',
	outputSchema: zohoDeskFindAgentByEmailOutputSchema,
	displayName: 'Get Agent',
	description: 'Gets an agent by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets one agent by ID with name, email, role, profile and departments.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		agentId: zohoDeskAiProps.agentId({ required: true }),
	},
	async run(context) {
		const { orgId, agentId } = context.propsValue;
		return await zohoDeskApi.getAgent({ auth: context.auth, orgId, agentId });
	},
});
