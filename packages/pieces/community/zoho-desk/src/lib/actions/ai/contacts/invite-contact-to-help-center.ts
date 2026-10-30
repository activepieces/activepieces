import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskInviteContactToHelpCenterOutputSchema } from '../../../output-schemas';

export const zohoDeskInviteContactToHelpCenterAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_invite_contact_to_help_center',
	outputSchema: zohoDeskInviteContactToHelpCenterOutputSchema,
	displayName: 'Invite Contact To Help Center',
	description: 'Invites one contact to a help center.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Emails a help-center invitation to one contact. Not idempotent: each call sends the invitation again.',
		idempotent: false,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		contactId: zohoDeskAiProps.contactId({ required: true }),
		helpCenterId: Property.ShortText({
			displayName: 'Help Center ID',
			description: 'Help center ID (from List Help Centers).',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, contactId, helpCenterId } = context.propsValue;
		await zohoDeskApi.inviteContactToHelpCenter({
			auth: context.auth,
			orgId,
			contactId,
			helpCenterId,
		});
		return { success: true, contactId, helpCenterId };
	},
});
