import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';

export const zohoDeskRemoveUserLabelsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_remove_user_labels',
	displayName: 'Remove User Labels',
	description: 'Removes labels from a help-center user.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: { description: 'Removes labels from one help-center user.', idempotent: true },
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
			description: 'Label IDs to remove.',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, userId, helpCenterId, labelIds } = context.propsValue;
		return await zohoDeskApi.removeUserLabels({
			auth: context.auth,
			orgId,
			userId,
			helpCenterId,
			labelIds: zohoDeskUtils.requiredStringList({ value: labelIds, propName: 'Label IDs' }),
		});
	},
});
