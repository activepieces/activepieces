import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceCreditNoteRefundOutputSchema } from '../../../output-schemas';

export const getCreditNoteRefundAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_get_credit_note_refund',
	outputSchema: zohoInvoiceCreditNoteRefundOutputSchema,
	displayName: 'Get Credit Note Refund',
	description: 'Gets one refund of a credit note.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns one credit note refund: date, refund mode, reference and amount. Use List Credit Notes for the credit note ID and List Credit Note Refunds for the refund ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		creditNoteId: zohoInvoiceAiProps.creditNoteId({ required: true }),
		refundId: zohoInvoiceAiProps.idProp({
			required: true,
			displayName: 'Refund ID',
			description: 'Credit note refund ID. Use List Credit Note Refunds to find it.',
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.getCreditNoteRefund({
			auth,
			organizationId: propsValue.organizationId,
			creditNoteId: propsValue.creditNoteId,
			refundId: propsValue.refundId,
		});
	},
});
