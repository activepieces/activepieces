import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';

export const zohoDeskRemoveUserBadgesAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_remove_user_badges',
	displayName: 'Remove User Badges',
	description: 'Removes badges from a help-center user.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: { description: 'Removes badges from one help-center user.', idempotent: true },
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
			description: 'Badge IDs to remove.',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, userId, badgeIds } = context.propsValue;
		return await zohoDeskApi.removeUserBadges({
			auth: context.auth,
			orgId,
			userId,
			badgeIds: zohoDeskUtils.requiredStringList({ value: badgeIds, propName: 'Badge IDs' }),
		});
	},
});
