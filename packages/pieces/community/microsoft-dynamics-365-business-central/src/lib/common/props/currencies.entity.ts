import { Property } from '@activepieces/pieces-framework';

export const currenciesEntityProps = {
	displayName: Property.ShortText({
		displayName: 'Display Name',
		required: false,
	}),
	code: Property.ShortText({
		displayName: 'Code',
		description: 'The code of the currency.',
		required: false,
	}),
	amountDecimalPlaces: Property.ShortText({
		displayName: 'Amount Decimal Places',
		description:
			'	Specifies the number of decimal places the system will display on amounts for this currency.',
		required: false,
	}),
	amountRoundingPrecision: Property.Number({
		displayName: 'Amount Rounding Precision',
		required: false,
	}),
};
