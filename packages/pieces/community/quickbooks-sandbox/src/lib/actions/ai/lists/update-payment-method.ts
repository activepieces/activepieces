import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreatePaymentMethodOutputSchema } from '../../../output-schemas';

export const updatePaymentMethodAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_update_payment_method',
	outputSchema: quickbooksSandboxCreatePaymentMethodOutputSchema,
	displayName: 'Update Payment Method',
	description: 'Changes fields of an existing payment method.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes only the fields you set on one payment method: it reads the current payment method and sends it back with your changes, so unset fields keep their values. Payment methods cannot be deleted; set Active to No to deactivate one. Get the id from List Payment Methods.',
		idempotent: true,
	},
	props: {
		paymentMethodId: quickbooksAiProps.id({
			required: true,
			displayName: 'Payment Method ID',
			description: 'QuickBooks payment method id. Use List Payment Methods to find it.',
		}),
		name: Property.ShortText({ displayName: 'Name', description: 'New payment method name.', required: false }),
		type: quickbooksAiProps.paymentMethodType({
			required: false,
			displayName: 'Type',
			description: 'Whether this is a credit card.',
		}),
		active: quickbooksAiProps.flag({
			required: false,
			displayName: 'Active',
			description: 'No deactivates the payment method (the way to remove it); Yes reactivates it.',
		}),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const { paymentMethodId, name, type, active, additionalFields } = context.propsValue;
		const fields = quickbooksUtils.requireChanges({
			fields: {
				...additionalFields,
				...quickbooksUtils.compact({
					fields: { Name: name, Type: type, Active: active ? active === 'true' : undefined },
				}),
			},
		});
		return await quickbooksApi.replaceEntity({ auth: context.auth, entity: 'PaymentMethod', id: paymentMethodId, fields });
	},
});
