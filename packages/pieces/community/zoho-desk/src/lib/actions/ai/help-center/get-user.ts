import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';

export const zohoDeskGetUserAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_user',
	displayName: 'Get User',
	description: 'Gets a help-center user by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets one help-center user with name, email, status, label and linked contact ID.',
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
	},
	async run(context) {
		const { orgId, userId, helpCenterId } = context.propsValue;
		return await zohoDeskApi.getUser({ auth: context.auth, orgId, userId, helpCenterId });
	},
});
