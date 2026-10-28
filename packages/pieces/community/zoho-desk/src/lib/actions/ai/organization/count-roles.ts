import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskCountAgentsOutputSchema } from '../../../output-schemas';

export const zohoDeskCountRolesAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_count_roles',
	outputSchema: zohoDeskCountAgentsOutputSchema,
	displayName: 'Count Roles',
	description: 'Counts roles.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Returns the number of roles, optionally only default or visible ones.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		isDefault: zohoDeskAiProps.yesNo({
			required: false,
			displayName: 'Is Default',
			description: 'Yes counts only default roles.',
		}),
		isVisible: zohoDeskAiProps.yesNo({
			required: false,
			displayName: 'Is Visible',
			description: 'Yes counts only visible roles.',
		}),
	},
	async run(context) {
		const { orgId, isDefault, isVisible } = context.propsValue;
		return await zohoDeskApi.countRoles({ auth: context.auth, orgId, isDefault, isVisible });
	},
});
