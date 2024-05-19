import { Property } from '@activepieces/pieces-framework';

export const contactsEntityProps = {
	number: Property.ShortText({
		displayName: 'Number',
		required: false,
	}),
	displayName: Property.ShortText({
		displayName: 'Display Name',
		required: false,
	}),
	type: Property.StaticDropdown({
		displayName: 'Type',
		required: false,
		options: {
			disabled: false,
			options: [
				{
					label: 'Person',
					value: 'Person',
				},
				{ label: 'Company', value: 'Company' },
			],
		},
	}),
	jobTitle: Property.ShortText({
		displayName: 'Job Title',
		required: false,
	}),
	companyNumber: Property.ShortText({
		displayName: 'Company Number',
		required: false,
	}),
	companyName: Property.ShortText({
		displayName: 'Company Name',
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
	mobilePhoneNumber: Property.ShortText({
		displayName: 'Mobile Number',
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
	privacyBlocked: Property.Checkbox({
		displayName: 'Privacy Blocked?',
		description: 'Specifies whether the privacy of the contact is blocked.',
		required: false,
	}),
	taxRegistrationNumber: Property.ShortText({
		displayName: 'Tax Registration Number',
		required: false,
	}),
};
