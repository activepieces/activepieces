import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskCountAgentsByTypeOutputSchema } from '../../../output-schemas';

export const zohoDeskCountAgentsByTypeAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_count_agents_by_type',
	outputSchema: zohoDeskCountAgentsByTypeOutputSchema,
	displayName: 'Count Agents By Type',
	description: 'Counts agents by type.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Returns agent counts by type: active, deactivated, unconfirmed, light, imported and deleted.',
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
		return await zohoDeskApi.countAgentsByType({ auth: context.auth, orgId });
	},
});
