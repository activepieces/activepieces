import { Property } from '@activepieces/pieces-framework';

export const vendorsEntityProps = {
	number: Property.ShortText({
		displayName: 'Number',
		required: false,
	}),
	displayName: Property.ShortText({
		displayName: 'Display Name',
		required: false,
	}),
	addressLine1: Property.LongText({
		displayName: 'Address Line 1',
		required: false,
	}),
	addressLine2: Property.LongText({
		displayName: 'Address Line 2',
		required: false,
	}),
	city: Property.ShortText({
		displayName: 'City',
		required: false,
	}),
	state: Property.ShortText({
		displayName: 'State',
		required: false,
	}),
	country: Property.ShortText({
		displayName: 'Country',
		required: false,
	}),
	postalCode: Property.ShortText({
		displayName: 'Postal Code',
		required: false,
	}),
	email: Property.ShortText({
		displayName: 'Email',
		required: false,
	}),
	website: Property.ShortText({
		displayName: 'Website',
		required: false,
	}),
	taxLiable: Property.Checkbox({
		displayName: 'Tax Liable?',
		required: false,
	}),
	taxRegistrationNumber: Property.ShortText({
		displayName: 'Tax Registration Number',
		required: false,
	}),
	currencyId: Property.ShortText({
		displayName: 'Currency ID',
		required: false,
	}),
	currencyCode: Property.ShortText({
		displayName: 'Currency Code',
		required: false,
	}),
	paymentTermsId: Property.ShortText({
		displayName: 'Payment Terms ID',
		required: false,
	}),
	paymentMethodId: Property.ShortText({
		displayName: 'Payment Method ID',
		required: false,
	}),
	blocked: Property.StaticDropdown({
		displayName: 'Blocked',
		description: 'Specifies which transactions with the customer cannot be posted',
		required: false,
		defaultValue: '',
		options: {
			disabled: false,
			options: [
				{
					label: 'Ship',
					value: 'Ship',
				},
				{
					label: 'Invoice',
					value: 'Invoice',
				},
				{
					label: 'All',
					value: 'All',
				},
			],
		},
	}),
};
