import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskGetTeamOutputSchema } from '../../../output-schemas';

export const zohoDeskGetTeamAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_team',
	outputSchema: zohoDeskGetTeamOutputSchema,
	displayName: 'Get Team',
	description: 'Gets a team by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets one team by ID with its department, roles, agents and sub-teams.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		teamId: Property.ShortText({
			displayName: 'Team ID',
			description: 'Team ID (from List Department Teams).',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, teamId } = context.propsValue;
		return await zohoDeskApi.getTeam({ auth: context.auth, orgId, teamId });
	},
});
