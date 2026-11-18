import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxSendPaymentOutputSchema } from '../../../output-schemas';

export const sendPaymentAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_send_payment',
	outputSchema: quickbooksSandboxSendPaymentOutputSchema,
	displayName: 'Send Payment',
	description: 'Emails a payment to the customer.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Emails one payment receipt as a PDF to Send To. Each call sends another email. Get the id from List Payments.',
		idempotent: false,
	},
	props: {
		paymentId: quickbooksAiProps.id({
			required: true,
			displayName: 'Payment ID',
			description: 'QuickBooks payment id. Use List Payments to find it.',
		}),
		sendTo: quickbooksAiProps.sendTo({
			required: true,
			description: 'Email address to send the payment receipt to.',
		}),
	},
	async run(context) {
		return await quickbooksApi.sendEntity({
			auth: context.auth,
			entity: 'Payment',
			id: context.propsValue.paymentId,
			sendTo: context.propsValue.sendTo,
		});
	},
});
