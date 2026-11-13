import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskCountAgentsOutputSchema } from '../../../output-schemas';

export const zohoDeskCountAgentsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_count_agents',
	outputSchema: zohoDeskCountAgentsOutputSchema,
	displayName: 'Count Agents',
	description: 'Counts agents.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Returns the number of agents, optionally only active or disabled, confirmed, or including light agents.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Only agents with this status.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'ACTIVE', value: 'ACTIVE' },
					{ label: 'DISABLED', value: 'DISABLED' },
				],
			},
		}),
		isConfirmed: zohoDeskAiProps.yesNo({
			required: false,
			displayName: 'Is Confirmed',
			description: 'Yes counts only confirmed agents.',
		}),
		includeLightAgent: zohoDeskAiProps.yesNo({
			required: false,
			displayName: 'Include Light Agents',
			description: 'Yes includes light agents.',
		}),
	},
	async run(context) {
		const { orgId, status, isConfirmed, includeLightAgent } = context.propsValue;
		return await zohoDeskApi.countAgents({
			auth: context.auth,
			orgId,
			status,
			isConfirmed,
			includeLightAgent,
		});
	},
});
