import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageWithDataOutputSchema } from '../../../output-schemas';

export const resumeRecurringInvoiceAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_resume_recurring_invoice',
	outputSchema: zohoInvoiceMessageWithDataOutputSchema,
	displayName: 'Resume Recurring Invoice',
	description: 'Resumes a stopped recurring invoice profile.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Resumes a stopped recurring invoice profile so it generates invoices again on its schedule. Use List Recurring Invoices to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		recurringInvoiceId: zohoInvoiceAiProps.recurringInvoiceId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.resumeRecurringInvoice({
			auth,
			organizationId: propsValue.organizationId,
			recurringInvoiceId: propsValue.recurringInvoiceId,
		});
	},
});
