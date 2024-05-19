import { Property } from '@activepieces/pieces-framework';

export const employeesEntityProps = {
	number: Property.ShortText({
		displayName: 'Number',
		required: false,
	}),
	displayName: Property.ShortText({
		displayName: 'Display Name',
		required: false,
	}),
	givenName: Property.ShortText({
		displayName: 'First Name',
		required: false,
	}),
	middleName: Property.ShortText({
		displayName: 'Middle Name',
		required: false,
	}),
	surname: Property.ShortText({
		displayName: 'Last Name',
		required: false,
	}),
	jobTitle: Property.ShortText({
		displayName: 'Job Title',
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
	mobilePhone: Property.ShortText({
		displayName: 'Mobile Number',
		required: false,
	}),
	email: Property.ShortText({
		displayName: 'Email',
		required: false,
	}),
	personalEmail: Property.ShortText({
		displayName: 'Personal Email',
		required: false,
	}),
	status: Property.StaticDropdown({
		displayName: 'Status',
		description: 'Specifies the status of the employee.',
		required: false,
		options: {
			disabled: false,
			options: [
				{
					label: 'Active',
					value: 'Active',
				},
				{
					label: 'Inactive',
					value: 'Inactive',
				},
				{
					label: 'Terminated',
					value: 'Terminated',
				},
			],
		},
	}),
	birthDate: Property.DateTime({
		displayName: 'Birth Date',
		required: false,
	}),
	employmentDate: Property.DateTime({
		displayName: 'Employment Date',
		required: false,
	}),
};
