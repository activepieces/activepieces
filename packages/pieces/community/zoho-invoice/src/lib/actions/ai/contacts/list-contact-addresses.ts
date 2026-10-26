import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceListContactAddressesOutputSchema } from '../../../output-schemas';

export const listContactAddressesAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_contact_addresses',
	outputSchema: zohoInvoiceListContactAddressesOutputSchema,
	displayName: 'List Contact Addresses',
	description: 'Lists the additional addresses of a customer contact.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the additional addresses of a contact with their address_id, needed by Update Contact Address and Delete Contact Address. Use List Contacts to find the contact ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		contactId: zohoInvoiceAiProps.contactId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.listContactAddresses({
			auth,
			organizationId: propsValue.organizationId,
			contactId: propsValue.contactId,
		});
	},
});
