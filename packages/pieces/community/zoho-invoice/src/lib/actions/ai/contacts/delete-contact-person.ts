import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const deleteContactPersonAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_delete_contact_person',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Delete Contact Person',
	description: 'Deletes a contact person from a customer contact.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes one contact person. Use List Contact Persons to find the ID. Cannot be undone.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		contactPersonId: zohoInvoiceAiProps.contactPersonId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.deleteContactPerson({
			auth,
			organizationId: propsValue.organizationId,
			contactPersonId: propsValue.contactPersonId,
		});
	},
});
