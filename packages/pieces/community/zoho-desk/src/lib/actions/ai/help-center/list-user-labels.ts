import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';

export const zohoDeskListUserLabelsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_user_labels',
	displayName: 'List User Labels',
	description: 'Lists the labels on a help-center user.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: { description: 'Lists the labels on one help-center user.', idempotent: true },
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
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, userId, helpCenterId, from, limit } = context.propsValue;
		const labels = await zohoDeskApi.listUserLabels({
			auth: context.auth,
			orgId,
			userId,
			helpCenterId,
			from,
			limit,
		});
		return { labels, count: labels.length };
	},
});
