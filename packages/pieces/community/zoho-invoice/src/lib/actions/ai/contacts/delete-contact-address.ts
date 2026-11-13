import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const deleteContactAddressAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_delete_contact_address',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Delete Contact Address',
	description: 'Deletes an additional address of a customer contact.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes one additional address of a contact. Use List Contact Addresses to find the address ID. Cannot be undone.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		contactId: zohoInvoiceAiProps.contactId({ required: true }),
		addressId: zohoInvoiceAiProps.idProp({
			required: true,
			displayName: 'Address ID',
			description: 'Additional address ID. Use List Contact Addresses to find it.',
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.deleteContactAddress({
			auth,
			organizationId: propsValue.organizationId,
			contactId: propsValue.contactId,
			addressId: propsValue.addressId,
		});
	},
});
