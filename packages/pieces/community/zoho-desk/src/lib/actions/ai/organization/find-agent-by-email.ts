import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskFindAgentByEmailOutputSchema } from '../../../output-schemas';

export const zohoDeskFindAgentByEmailAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_find_agent_by_email',
	outputSchema: zohoDeskFindAgentByEmailOutputSchema,
	displayName: 'Find Agent By Email',
	description: 'Finds an agent by email address.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Gets the agent with this email address, for when you know an agent's email but not their ID.",
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		email: Property.ShortText({
			displayName: 'Email',
			description: 'Agent email address.',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, email } = context.propsValue;
		return await zohoDeskApi.findAgentByEmail({ auth: context.auth, orgId, email });
	},
});
