import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';

export const zohoDeskUpdateUserAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_update_user',
	displayName: 'Update User',
	description: 'Activates or disables a help-center user.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: "Sets one help-center user's status to Active or Disabled.",
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
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'New status.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'ACTIVE', value: 'ACTIVE' },
					{ label: 'DISABLED', value: 'DISABLED' },
				],
			},
		}),
	},
	async run(context) {
		const { orgId, userId, helpCenterId, status } = context.propsValue;
		return await zohoDeskApi.updateUser({
			auth: context.auth,
			orgId,
			userId,
			helpCenterId,
			status,
		});
	},
});
