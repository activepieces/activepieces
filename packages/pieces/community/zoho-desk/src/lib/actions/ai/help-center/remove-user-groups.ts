import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';

export const zohoDeskRemoveUserGroupsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_remove_user_groups',
	displayName: 'Remove User Groups',
	description: 'Removes a help-center user from groups.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: { description: 'Removes one help-center user from groups.', idempotent: true },
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
			description: 'Group IDs to remove the user from.',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, userId, helpCenterId, groupIds } = context.propsValue;
		return await zohoDeskApi.removeUserGroups({
			auth: context.auth,
			orgId,
			userId,
			helpCenterId,
			groupIds: zohoDeskUtils.requiredStringList({ value: groupIds, propName: 'Group IDs' }),
		});
	},
});
