import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';

export const zohoDeskAddUserBadgesAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_add_user_badges',
	displayName: 'Add User Badges',
	description: 'Awards badges to a help-center user.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: { description: 'Awards badges to one help-center user.', idempotent: true },
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
		badgeIds: Property.Array({
			displayName: 'Badge IDs',
			description: 'Badge IDs to award (from List Badges).',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, userId, badgeIds } = context.propsValue;
		return await zohoDeskApi.addUserBadges({
			auth: context.auth,
			orgId,
			userId,
			badgeIds: zohoDeskUtils.requiredStringList({ value: badgeIds, propName: 'Badge IDs' }),
		});
	},
});
