import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const deleteContactAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_delete_contact',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Delete Contact',
	description: 'Deletes a customer contact.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a contact. Use List Contacts to find the ID. To hide a contact but keep it, use Mark Contact Inactive instead. Cannot be undone.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		contactId: zohoInvoiceAiProps.contactId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.deleteContact({
			auth,
			organizationId: propsValue.organizationId,
			contactId: propsValue.contactId,
		});
	},
});
