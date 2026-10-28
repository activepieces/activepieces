import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceUserOutputSchema } from '../../../output-schemas';

export const updateUserAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_update_user',
	outputSchema: zohoInvoiceUserOutputSchema,
	displayName: 'Update User',
	description: "Changes a user's name, email or role.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Changes a user's name, email or role. Fields left empty keep their current value. Use List Users to find the ID. Needs the Admin role.",
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		userId: zohoInvoiceAiProps.userId({ required: true }),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'New full name. Empty = unchanged.',
			required: false,
		}),
		email: Property.ShortText({
			displayName: 'Email',
			description: 'New email address. Empty = unchanged.',
			required: false,
		}),
		userRole: Property.ShortText({
			displayName: 'Role',
			description: 'New role name, e.g. "admin", "staff" or "timesheetstaff". Empty = unchanged.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const { organizationId, userId } = propsValue;
		const current = await zohoInvoiceApi.getUser({ auth, organizationId, userId });
		return await zohoInvoiceApi.updateUser({
			auth,
			organizationId,
			userId,
			body: zohoInvoiceUtils.compact({
				name: propsValue.name ?? current.user?.name,
				email: propsValue.email ?? current.user?.email,
				user_role: propsValue.userRole,
			}),
		});
	},
});
