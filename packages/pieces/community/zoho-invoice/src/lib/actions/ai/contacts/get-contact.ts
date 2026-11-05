import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceContactOutputSchema } from '../../../output-schemas';

export const getContactAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_get_contact',
	outputSchema: zohoInvoiceContactOutputSchema,
	displayName: 'Get Contact',
	description: 'Gets one customer contact by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns one contact by ID with its addresses, contact persons, currency, payment terms and balances. Use List Contacts to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		contactId: zohoInvoiceAiProps.contactId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.getContact({
			auth,
			organizationId: propsValue.organizationId,
			contactId: propsValue.contactId,
		});
	},
});
