import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceCreditNoteRefundsOutputSchema } from '../../../output-schemas';

export const listAllCreditNoteRefundsAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_all_credit_note_refunds',
	outputSchema: zohoInvoiceCreditNoteRefundsOutputSchema,
	displayName: 'List All Credit Note Refunds',
	description: 'Lists credit note refunds across all credit notes.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists refunds across every credit note with creditnote_id and creditnote_refund_id, one page at a time. Filter by customer. Use List Credit Note Refunds for a single credit note.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		customerId: zohoInvoiceAiProps.contactId({ required: false, displayName: 'Customer ID' }),
		sortColumn: zohoInvoiceAiProps.sortColumn({
			required: false,
			description:
				'Field to sort by: refund_mode, reference_number, date, creditnote_number, customer_name, amount_bcy or amount_fcy.',
		}),
		page: zohoInvoiceAiProps.page({ required: false }),
		perPage: zohoInvoiceAiProps.perPage({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.listAllCreditNoteRefunds({
			auth,
			organizationId: propsValue.organizationId,
			customerId: propsValue.customerId,
			sortColumn: propsValue.sortColumn,
			page: propsValue.page,
			perPage: propsValue.perPage,
		});
	},
});
