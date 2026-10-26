import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskGetAgentTimeEntryOutputSchema } from '../../../output-schemas';

export const zohoDeskGetAgentTimeEntryAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_agent_time_entry',
	outputSchema: zohoDeskGetAgentTimeEntryOutputSchema,
	displayName: 'Get Agent Time Entry',
	description: 'Gets one time entry logged by an agent.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets one time entry logged by an agent, with its record, duration and cost.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		agentId: zohoDeskAiProps.agentId({ required: true }),
		timeEntryId: Property.ShortText({
			displayName: 'Time Entry ID',
			description: 'Time entry ID (from the matching List Time Entries action).',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, agentId, timeEntryId } = context.propsValue;
		return await zohoDeskApi.getAgentTimeEntry({ auth: context.auth, orgId, agentId, timeEntryId });
	},
});
