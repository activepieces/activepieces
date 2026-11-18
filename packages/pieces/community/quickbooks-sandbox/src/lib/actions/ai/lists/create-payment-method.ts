import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreatePaymentMethodOutputSchema } from '../../../output-schemas';

export const createPaymentMethodAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_create_payment_method',
	outputSchema: quickbooksSandboxCreatePaymentMethodOutputSchema,
	displayName: 'Create Payment Method',
	description: 'Creates a payment method such as a card brand or cash.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a payment method (e.g. Cash, Check, Visa), referenced by PaymentMethodRef on payments and sales receipts. Not idempotent: each call creates a new payment method, and a duplicate name is rejected.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Payment method name, unique among payment methods.',
			required: true,
		}),
		type: quickbooksAiProps.paymentMethodType({
			required: false,
			displayName: 'Type',
			description: 'Whether this is a credit card. Defaults to not a credit card.',
		}),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const { name, type, additionalFields } = context.propsValue;
		return await quickbooksApi.createEntity({
			auth: context.auth,
			entity: 'PaymentMethod',
			body: {
				...additionalFields,
				...quickbooksUtils.compact({ fields: { Name: name, Type: type } }),
			},
		});
	},
});

