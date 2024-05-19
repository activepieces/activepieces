import { Property } from '@activepieces/pieces-framework';

export const paymentMethodsEntityProps = {
	code: Property.ShortText({
		displayName: 'Code',
		description: 'The code of the payment method.',
		required: false,
	}),
	displayName: Property.ShortText({
		displayName: 'Display Name',
		description:
			"Specifies the payment method's name. This name will appear on all sales documents for the payment method.",
		required: false,
	}),
};
