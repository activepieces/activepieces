import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';

export const zohoDeskAssignUserLabelsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_assign_user_labels',
	displayName: 'Assign User Labels',
	description: 'Assigns labels to a help-center user.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Assigns labels to one help-center user; Primary Label ID, when set, must be one of Label IDs and becomes the label shown next to their name.',
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
		labelIds: Property.Array({
			displayName: 'Label IDs',
			description: 'Label IDs to assign (from List Labels).',
			required: true,
		}),
		primaryLabelId: Property.ShortText({
			displayName: 'Primary Label ID',
			description: "One of Label IDs to show as the user's primary label.",
			required: false,
		}),
	},
	async run(context) {
		const { orgId, userId, helpCenterId, labelIds, primaryLabelId } = context.propsValue;
		return await zohoDeskApi.assignUserLabels({
			auth: context.auth,
			orgId,
			userId,
			helpCenterId,
			labelIds: zohoDeskUtils.requiredStringList({ value: labelIds, propName: 'Label IDs' }),
			primaryLabelId,
		});
	},
});
