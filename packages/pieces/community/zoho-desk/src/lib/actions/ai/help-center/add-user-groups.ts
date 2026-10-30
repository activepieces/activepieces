import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';

export const zohoDeskAddUserGroupsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_add_user_groups',
	displayName: 'Add User Groups',
	description: 'Adds a help-center user to groups.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds one help-center user to groups; groups decide which help-center content they can see.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		userId: Property.ShortText({
			displayName: 'User ID',
			description: 'Help-center user ID (from List Users).',
			required: true,
		}),
		helpCenterId: Property.ShortText({
			displayName: 'Help Center ID',
			description: 'Help center ID (from List Help Centers); needed when there is more than one.',
			required: false,
		}),
		groupIds: Property.Array({
			displayName: 'Group IDs',
			description: 'Group IDs to add the user to (from List Help Center Groups).',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, userId, helpCenterId, groupIds } = context.propsValue;
		return await zohoDeskApi.addUserGroups({
			auth: context.auth,
			orgId,
			userId,
			helpCenterId,
			groupIds: zohoDeskUtils.requiredStringList({ value: groupIds, propName: 'Group IDs' }),
		});
	},
});
