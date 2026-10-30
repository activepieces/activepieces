import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskListOrganizationsOutputSchema } from '../../../output-schemas';

export const zohoDeskListOrganizationsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_organizations',
	outputSchema: zohoDeskListOrganizationsOutputSchema,
	displayName: 'List Organizations',
	description: 'Lists the Zoho Desk organizations the connection can access.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the Zoho Desk organizations (portals) the connected user belongs to. Every other action needs one of these IDs as Organization ID.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		const organizations = await zohoDeskApi.listOrganizationRecords({ auth: context.auth });
		return { organizations, count: organizations.length };
	},
});
