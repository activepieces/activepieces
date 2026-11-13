import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceListContactCommentsOutputSchema } from '../../../output-schemas';

export const listContactCommentsAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_contact_comments',
	outputSchema: zohoInvoiceListContactCommentsOutputSchema,
	displayName: 'List Contact Comments',
	description: 'Lists the comments and history of a customer contact.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the comments and activity history recorded on a contact, one page at a time. Use List Contacts to find the contact ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		contactId: zohoInvoiceAiProps.contactId({ required: true }),
		page: zohoInvoiceAiProps.page({ required: false }),
		perPage: zohoInvoiceAiProps.perPage({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.listContactComments({
			auth,
			organizationId: propsValue.organizationId,
			contactId: propsValue.contactId,
			page: propsValue.page,
			perPage: propsValue.perPage,
		});
	},
});
