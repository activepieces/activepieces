import { Property } from '@activepieces/pieces-framework';

export const shipmentMethodsEntityProps = {
	displayName: Property.ShortText({
		displayName: 'Display Name',
		description:
			"Specifies the shipment method's name. This name will appear on all sales documents for the shipment method.",
		required: false,
	}),
	code: Property.ShortText({
		displayName: 'Code',
		description: 'TThe code of the shipment method.',
		required: false,
	}),
};
