import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListRolesOutputSchema } from '../../../output-schemas';

export const zohoDeskListRolesAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_roles',
	outputSchema: zohoDeskListRolesOutputSchema,
	displayName: 'List Roles',
	description: 'Lists agent roles.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists agent roles in the organization; role `id` values filter List Agents.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		searchStr: Property.ShortText({
			displayName: 'Search Text',
			description: 'Text to match in role names.',
			required: false,
		}),
		isDefault: zohoDeskAiProps.yesNo({
			required: false,
			displayName: 'Is Default',
			description: 'Yes returns only default roles.',
		}),
		isVisible: zohoDeskAiProps.yesNo({
			required: false,
			displayName: 'Is Visible',
			description: 'Yes returns only visible roles.',
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, searchStr, isDefault, isVisible, from, limit } = context.propsValue;
		const roles = await zohoDeskApi.listRoles({
			auth: context.auth,
			orgId,
			searchStr,
			isDefault,
			isVisible,
			from,
			limit,
		});
		return { roles, count: roles.length };
	},
});
