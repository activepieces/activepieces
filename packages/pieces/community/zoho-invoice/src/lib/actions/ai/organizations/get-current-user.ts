import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUserOutputSchema } from '../../../output-schemas';

export const getCurrentUserAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_get_current_user',
	outputSchema: zohoInvoiceUserOutputSchema,
	displayName: 'Get Current User',
	description: 'Gets the user the connection is signed in as.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns the connected user in the given organization: user_id, name, email, role and status. Use it to find your own user ID for time entries and project assignments.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.getCurrentUser({ auth, organizationId: propsValue.organizationId });
	},
});
