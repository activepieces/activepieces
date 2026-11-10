import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceCommentOutputSchema } from '../../../output-schemas';

export const addInvoiceCommentAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_add_invoice_comment',
	outputSchema: zohoInvoiceCommentOutputSchema,
	displayName: 'Add Invoice Comment',
	description: 'Adds a comment to an invoice.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds a comment to an invoice, optionally visible to the customer and with an expected payment date. Use List Invoices to find the ID. Not idempotent: each call adds another comment.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		invoiceId: zohoInvoiceAiProps.invoiceId({ required: true }),
		description: Property.LongText({
			displayName: 'Comment',
			description: 'Comment text.',
			required: true,
		}),
		paymentExpectedDate: Property.ShortText({
			displayName: 'Payment Expected Date',
			description: 'Date the customer is expected to pay (yyyy-mm-dd).',
			required: false,
		}),
		showCommentToClients: zohoInvoiceAiProps.yesNo({
			required: false,
			displayName: 'Show to Customer',
			description: 'Yes to show the comment to the customer in the portal.',
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.addInvoiceComment({
			auth,
			organizationId: propsValue.organizationId,
			invoiceId: propsValue.invoiceId,
			body: zohoInvoiceUtils.compact({
				description: propsValue.description,
				payment_expected_date: propsValue.paymentExpectedDate,
				show_comment_to_clients: zohoInvoiceUtils.toOptionalBoolean({
					value: propsValue.showCommentToClients,
				}),
			}),
		});
	},
});
