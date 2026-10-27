import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskAssociateAccountProductsOutputSchema } from '../../../output-schemas';

export const zohoDeskRejectContactHelpCenterAccessAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_reject_contact_help_center_access',
	outputSchema: zohoDeskAssociateAccountProductsOutputSchema,
	displayName: 'Reject Contact Help Center Access',
	description: "Rejects a contact's pending help-center signup.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: "Rejects one contact's pending signup to the given help centers.",
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		contactId: zohoDeskAiProps.contactId({ required: true }),
		helpCenterIds: Property.Array({
			displayName: 'Help Center IDs',
			description: 'Help center IDs to reject the contact for.',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, contactId, helpCenterIds } = context.propsValue;
		return await zohoDeskApi.rejectContactHelpCenterAccess({
			auth: context.auth,
			orgId,
			contactId,
			helpCenterIds: zohoDeskUtils.requiredStringList({
				value: helpCenterIds,
				propName: 'Help Center IDs',
			}),
		});
	},
});
