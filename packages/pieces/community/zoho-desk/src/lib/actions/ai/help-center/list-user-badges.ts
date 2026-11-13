import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';

export const zohoDeskListUserBadgesAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_user_badges',
	displayName: 'List User Badges',
	description: 'Lists the badges a help-center user has earned.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the community badges one help-center user has, optionally only custom or default ones.',
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
		type: Property.StaticDropdown({
			displayName: 'Type',
			description: 'Only badges of this type.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'custom', value: 'custom' },
					{ label: 'default', value: 'default' },
				],
			},
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, userId, type, from, limit } = context.propsValue;
		const badges = await zohoDeskApi.listUserBadges({
			auth: context.auth,
			orgId,
			userId,
			type,
			from,
			limit,
		});
		return { badges, count: badges.length };
	},
});
