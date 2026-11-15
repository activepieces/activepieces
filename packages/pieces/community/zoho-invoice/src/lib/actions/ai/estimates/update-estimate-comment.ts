import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceAddEstimateCommentOutputSchema } from '../../../output-schemas';

export const updateEstimateCommentAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_update_estimate_comment',
	outputSchema: zohoInvoiceAddEstimateCommentOutputSchema,
	displayName: 'Update Estimate Comment',
	description: 'Changes a comment on an estimate.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes the text or customer visibility of a comment on an estimate. Fields left empty are not sent. Use List Estimates for the estimate ID and List Estimate Comments for the comment ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		estimateId: zohoInvoiceAiProps.estimateId({ required: true }),
		commentId: zohoInvoiceAiProps.commentId({
			required: true,
			description: 'Comment ID. Use List Estimate Comments to find it.',
		}),
		description: Property.LongText({
			displayName: 'Comment',
			description: 'New text of the comment. Empty = unchanged.',
			required: false,
		}),
		showCommentToClients: zohoInvoiceAiProps.yesNo({
			required: false,
			displayName: 'Show to Customer',
			description:
				'Yes to show the comment in the customer portal, No to hide it. Empty = unchanged.',
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.updateEstimateComment({
			auth,
			organizationId: propsValue.organizationId,
			estimateId: propsValue.estimateId,
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
