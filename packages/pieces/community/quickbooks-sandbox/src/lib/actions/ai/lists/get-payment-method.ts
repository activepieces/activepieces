import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxCreatePaymentMethodOutputSchema } from '../../../output-schemas';

export const getPaymentMethodAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_payment_method',
	outputSchema: quickbooksSandboxCreatePaymentMethodOutputSchema,
	displayName: 'Get Payment Method',
	description: 'Gets one payment method by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Reads one payment method with its name, type and SyncToken. Get the id from List Payment Methods or Create Payment Method.',
		idempotent: true,
	},
	props: {
		paymentMethodId: quickbooksAiProps.id({
			required: true,
			displayName: 'Payment Method ID',
			description: 'QuickBooks payment method id. Use List Payment Methods to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.getEntity({
			auth: context.auth,
			entity: 'PaymentMethod',
			id: context.propsValue.paymentMethodId,
		});
	},
});
