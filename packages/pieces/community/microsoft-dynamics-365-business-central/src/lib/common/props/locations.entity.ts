import { Property } from '@activepieces/pieces-framework';

export const locationsEntityProps = {
	code: Property.ShortText({
		displayName: 'Code',
		description: 'The code of the location.',
		required: false,
	}),
	displayName: Property.ShortText({
		displayName: 'Display Name',
		description:
			"Specifies the location's name. This name will appear on all sales documents for the location.",
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
	phoneNumber: Property.ShortText({
		displayName: 'Phone Number',
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
	contact: Property.ShortText({
		displayName: 'Contact',
		required: false,
	}),
};
