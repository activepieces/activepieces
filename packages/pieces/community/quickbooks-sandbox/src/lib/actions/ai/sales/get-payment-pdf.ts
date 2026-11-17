import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxGetCreditMemoPdfOutputSchema } from '../../../output-schemas';

export const getPaymentPdfAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_payment_pdf',
	outputSchema: quickbooksSandboxGetCreditMemoPdfOutputSchema,
	displayName: 'Get Payment PDF',
	description: 'Downloads a payment as a PDF file.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Downloads one payment as a PDF and returns it as a file reference. Get the id from List Payments.',
		idempotent: true,
	},
	props: {
		paymentId: quickbooksAiProps.id({
			required: true,
			displayName: 'Payment ID',
			description: 'QuickBooks payment id. Use List Payments to find it.',
		}),
	},
	async run(context) {
		const { paymentId } = context.propsValue;
		const data = await quickbooksApi.downloadPdf({ auth: context.auth, entity: 'Payment', id: paymentId });
		const fileName = `payment-${paymentId}.pdf`;
		const file = await context.files.write({ fileName, data });
		return { file, fileName };
	},
});
