import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const markContactActiveAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_mark_contact_active',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Mark Contact Active',
	description: 'Marks a customer contact as active.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Reactivates an inactive contact so it can be used on new transactions again. Use List Contacts to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		contactId: zohoInvoiceAiProps.contactId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.markContactActive({
			auth,
			organizationId: propsValue.organizationId,
			contactId: propsValue.contactId,
		});
	},
});
