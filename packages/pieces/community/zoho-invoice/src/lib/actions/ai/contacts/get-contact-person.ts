import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceContactPersonOutputSchema } from '../../../output-schemas';

export const getContactPersonAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_get_contact_person',
	outputSchema: zohoInvoiceContactPersonOutputSchema,
	displayName: 'Get Contact Person',
	description: 'Gets one contact person of a customer contact.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns one contact person by ID: name, email, phones, job and portal status. Use List Contacts for the contact ID and List Contact Persons for the person ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		contactId: zohoInvoiceAiProps.contactId({ required: true }),
		contactPersonId: zohoInvoiceAiProps.contactPersonId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.getContactPerson({
			auth,
			organizationId: propsValue.organizationId,
			contactId: propsValue.contactId,
			contactPersonId: propsValue.contactPersonId,
		});
	},
});
