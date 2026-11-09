import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const markContactInactiveAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_mark_contact_inactive',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Mark Contact Inactive',
	description: 'Marks a customer contact as inactive.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Deactivates a contact so it is hidden from new transactions while keeping its history; reversible with Mark Contact Active. Use List Contacts to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		contactId: zohoInvoiceAiProps.contactId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.markContactInactive({
			auth,
			organizationId: propsValue.organizationId,
			contactId: propsValue.contactId,
		});
	},
});
