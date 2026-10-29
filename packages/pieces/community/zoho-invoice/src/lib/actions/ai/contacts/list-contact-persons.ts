import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceListContactPersonsOutputSchema } from '../../../output-schemas';

export const listContactPersonsAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_contact_persons',
	outputSchema: zohoInvoiceListContactPersonsOutputSchema,
	displayName: 'List Contact Persons',
	description: 'Lists the contact persons of a customer contact.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the people of one contact with their contact_person_id, name, email, phone and primary flag, one page at a time. Use List Contacts to find the contact ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		contactId: zohoInvoiceAiProps.contactId({ required: true }),
		page: zohoInvoiceAiProps.page({ required: false }),
		perPage: zohoInvoiceAiProps.perPage({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.listContactPersons({
			auth,
			organizationId: propsValue.organizationId,
			contactId: propsValue.contactId,
			page: propsValue.page,
			perPage: propsValue.perPage,
		});
	},
});
