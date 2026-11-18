import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const setEstimateTemplateAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_set_estimate_template',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Set Estimate Template',
	description: 'Changes the PDF template of an estimate.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Switches the PDF template used to render an estimate. Use List Estimates for the estimate ID and List Estimate Templates for the template ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		estimateId: zohoInvoiceAiProps.estimateId({ required: true }),
		templateId: zohoInvoiceAiProps.templateId({
			required: true,
			description: 'Estimate PDF template ID. Use List Estimate Templates to find it.',
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.setEstimateTemplate({
			auth,
			organizationId: propsValue.organizationId,
			estimateId: propsValue.estimateId,
			templateId: propsValue.templateId,
		});
	},
});
