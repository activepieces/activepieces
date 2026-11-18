import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListTeamMembersOutputSchema } from '../../../output-schemas';

export const zohoDeskListTeamMembersAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_team_members',
	outputSchema: zohoDeskListTeamMembersOutputSchema,
	displayName: 'List Team Members',
	description: 'Lists the agents in a team.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: { description: 'Lists the agents who are members of one team.', idempotent: true },
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
		return await zohoDeskApi.listTeamMembers({ auth: context.auth, orgId, teamId });
	},
});
