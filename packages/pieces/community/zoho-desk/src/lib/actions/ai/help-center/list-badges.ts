import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListBadgesOutputSchema } from '../../../output-schemas';

export const zohoDeskListBadgesAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_badges',
	outputSchema: zohoDeskListBadgesOutputSchema,
	displayName: 'List Badges',
	description: 'Lists the community badges defined in the organization.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists every community badge that can be awarded to help-center users, with its ID and name. Use it to get the badge IDs for Add User Badges.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
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
		const { orgId, type, from, limit } = context.propsValue;
		const badges = await zohoDeskApi.listBadges({
			auth: context.auth,
			orgId,
			type,
			from,
			limit,
		});
		return { badges, count: badges.length };
	},
});
