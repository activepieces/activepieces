import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUserOutputSchema } from '../../../output-schemas';

export const getUserAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_get_user',
	outputSchema: zohoInvoiceUserOutputSchema,
	displayName: 'Get User',
	description: 'Gets one user of a Zoho Invoice organization.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns one user by ID: name, email, role and status. Use List Users to find the ID. Needs the Admin role.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		userId: zohoInvoiceAiProps.userId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.getUser({
			auth,
			organizationId: propsValue.organizationId,
			userId: propsValue.userId,
		});
	},
});
