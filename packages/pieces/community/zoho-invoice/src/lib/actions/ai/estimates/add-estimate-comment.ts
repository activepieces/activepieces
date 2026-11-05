import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceAddEstimateCommentOutputSchema } from '../../../output-schemas';

export const addEstimateCommentAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_add_estimate_comment',
	outputSchema: zohoInvoiceAddEstimateCommentOutputSchema,
	displayName: 'Add Estimate Comment',
	description: 'Adds a comment to an estimate.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds a comment to an estimate, optionally visible to the customer. Use List Estimates to find the ID. Not idempotent: each call adds another comment.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		estimateId: zohoInvoiceAiProps.estimateId({ required: true }),
		description: Property.LongText({
			displayName: 'Comment',
			description: 'Text of the comment.',
			required: true,
		}),
		showCommentToClients: zohoInvoiceAiProps.yesNo({
			required: false,
			displayName: 'Show to Customer',
			description:
				'Yes to show the comment in the customer portal. Empty = the vendor default (hidden).',
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.addEstimateComment({
			auth,
			organizationId: propsValue.organizationId,
			estimateId: propsValue.estimateId,
			body: zohoInvoiceUtils.compact({
				description: propsValue.description,
				show_comment_to_clients: zohoInvoiceUtils.toOptionalBoolean({
					value: propsValue.showCommentToClients,
				}),
			}),
		});
	},
});
