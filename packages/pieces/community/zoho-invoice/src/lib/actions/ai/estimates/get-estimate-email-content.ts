import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceGetEstimateEmailContentOutputSchema } from '../../../output-schemas';

export const getEstimateEmailContentAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_get_estimate_email_content',
	outputSchema: zohoInvoiceGetEstimateEmailContentOutputSchema,
	displayName: 'Get Estimate Email Content',
	description: 'Gets the default email subject, body and recipients for an estimate.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns the subject, body, recipients and available email templates Zoho would use to email an estimate, without sending anything. Use it before Email Estimate to reuse or adjust the text. Use List Estimates to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		estimateId: zohoInvoiceAiProps.estimateId({ required: true }),
		emailTemplateId: Property.ShortText({
			displayName: 'Email Template ID',
			description:
				'Email template ID, from the emailtemplates list returned by Get Estimate Email Content. Empty = the default email template.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.getEstimateEmailContent({
			auth,
			organizationId: propsValue.organizationId,
			estimateId: propsValue.estimateId,
			emailTemplateId: propsValue.emailTemplateId,
		});
	},
});
