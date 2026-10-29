import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceCommentOutputSchema } from '../../../output-schemas';

export const updateInvoiceCommentAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_update_invoice_comment',
	outputSchema: zohoInvoiceCommentOutputSchema,
	displayName: 'Update Invoice Comment',
	description: 'Changes the text or visibility of an invoice comment.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes the text or customer visibility of a comment on an invoice; fields left empty are not sent. Use List Invoices for the invoice ID and List Invoice Comments for the comment ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		invoiceId: zohoInvoiceAiProps.invoiceId({ required: true }),
		commentId: zohoInvoiceAiProps.commentId({
			required: true,
			description: 'Comment ID. Use List Invoice Comments to find it.',
		}),
		description: Property.LongText({
			displayName: 'Comment',
			description: 'New comment text. Empty = unchanged.',
			required: false,
		}),
		showCommentToClients: zohoInvoiceAiProps.yesNo({
			required: false,
			displayName: 'Show to Customer',
			description: 'Yes to show the comment to the customer, No to hide it. Empty = unchanged.',
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.updateInvoiceComment({
			auth,
			organizationId: propsValue.organizationId,
			invoiceId: propsValue.invoiceId,
			commentId: propsValue.commentId,
			body: zohoInvoiceUtils.compact({
				description: propsValue.description,
				show_comment_to_clients: zohoInvoiceUtils.toOptionalBoolean({
					value: propsValue.showCommentToClients,
				}),
			}),
		});
	},
});
