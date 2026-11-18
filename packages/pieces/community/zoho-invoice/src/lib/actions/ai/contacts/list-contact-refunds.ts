import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceListContactRefundsOutputSchema } from '../../../output-schemas';

export const listContactRefundsAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_contact_refunds',
	outputSchema: zohoInvoiceListContactRefundsOutputSchema,
	displayName: 'List Contact Refunds',
	description: 'Lists the credit note refunds of a customer contact.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the credit note refunds made to one contact, one page at a time. Use List Contacts to find the contact ID; for refunds of one credit note use List Credit Note Refunds.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		contactId: zohoInvoiceAiProps.contactId({ required: true }),
		page: zohoInvoiceAiProps.page({ required: false }),
		perPage: zohoInvoiceAiProps.perPage({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.listContactRefunds({
			auth,
			organizationId: propsValue.organizationId,
			contactId: propsValue.contactId,
			page: propsValue.page,
			perPage: propsValue.perPage,
		});
	},
});
