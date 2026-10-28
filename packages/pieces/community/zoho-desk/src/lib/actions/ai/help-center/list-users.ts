import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListUsersOutputSchema } from '../../../output-schemas';

export const zohoDeskListUsersAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_users',
	outputSchema: zohoDeskListUsersOutputSchema,
	displayName: 'List Users',
	description: 'Lists help-center users.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the end users of the help center (customer portal), optionally by status or a search term. Page with From and Limit.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		helpCenterId: Property.ShortText({
			displayName: 'Help Center ID',
			description: 'Help center ID (from List Help Centers); needed when there is more than one.',
			required: false,
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Only users with this status.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'ACTIVE', value: 'ACTIVE' },
					{ label: 'DISABLED', value: 'DISABLED' },
					{ label: 'DELETED', value: 'DELETED' },
					{ label: 'ALL', value: 'ALL' },
				],
			},
		}),
		searchBy: Property.ShortText({
			displayName: 'Search Text',
			description: 'Text to match in user names or emails.',
			required: false,
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, helpCenterId, status, searchBy, from, limit } = context.propsValue;
		const users = await zohoDeskApi.listUsers({
			auth: context.auth,
			orgId,
			helpCenterId,
			status,
			searchBy,
			from,
			limit,
		});
		return { users, count: users.length };
	},
});
