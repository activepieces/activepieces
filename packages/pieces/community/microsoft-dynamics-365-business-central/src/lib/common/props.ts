import { businessCentralAuth } from '../../';
import {
	DropdownOption,
	DynamicPropsValue,
	PiecePropValueSchema,
	Property,
} from '@activepieces/pieces-framework';
import { makeClient } from './client';
import { ENTITY_DROPDOWN_OPTIONS } from './constants';

export const entityProps = {
	customers: {
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
		taxAreaId: Property.ShortText({
			displayName: 'Tax Area ID',
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
		shipmentMethodId: Property.ShortText({
			displayName: 'Shipment Method ID',
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
	},
	bankAccounts: {
		number: Property.ShortText({
			displayName: 'Number',
			required: false,
		}),
		displayName: Property.ShortText({
			displayName: 'Display Name',
			required: false,
		}),
		bankAccountNumber: Property.ShortText({
			displayName: 'Bank Account Number',
			required: false,
		}),
		blocked: Property.Checkbox({
			displayName: 'Blocked ?',
			description:
				'Specifies that entries cannot be posted to the bank account. True indicates account is blocked and posting is not allowed.',
			required: false,
		}),
		currencyCode: Property.ShortText({
			displayName: 'Currency Code',
			required: false,
			description: 'The default currency code for the bank account.',
		}),
		currencyId: Property.ShortText({
			displayName: 'Currency ID',
			required: false,
		}),
		iban: Property.ShortText({
			displayName: 'IBAN',
			required: false,
		}),
	},
	contacts: {
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
	},
	currencies: {
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
	},
	vendors: {
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
	},
	disputeStatus: {
		code: Property.ShortText({
			displayName: 'Code',
			description: 'The code of the dispute status.',
			required: false,
		}),
		displayName: Property.ShortText({
			displayName: 'Display Name',
			description: `Specifies the dispute status's name. This name will appear on all sales documents for the dispute status.`,
			required: false,
		}),
	},
	employees: {
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
	},
};

export const commonProps = {
	company_id: Property.Dropdown({
		displayName: 'Company',
		required: true,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please connect account first',
				};
			}

			const authValue = auth as PiecePropValueSchema<typeof businessCentralAuth>;
			const client = makeClient(authValue);

			const res = await client.listCompanies();
			const options: DropdownOption<string>[] = [];

			for (const company of res.value) {
				options.push({ label: company.name, value: company.id });
			}

			return {
				disabled: false,
				options,
			};
		},
	}),
	record_id: Property.ShortText({
		displayName: 'Record ID',
		required: true,
	}),
	record_type: Property.StaticDropdown({
		displayName: 'Record Type',
		required: true,
		options: {
			disabled: false,
			options: ENTITY_DROPDOWN_OPTIONS,
		},
	}),
	record_fields: Property.DynamicProperties({
		displayName: 'Record Fields',
		refreshers: ['record_type'],
		required: true,
		props: async ({ auth, record_type }) => {
			if (!auth) return {};
			if (!record_type) return {};

			const recordType = record_type as unknown as string;
			let fields: DynamicPropsValue = {};

			switch (recordType) {
				case 'customers':
					fields = entityProps.customers;
					break;
				case 'bankAccounts':
					fields = entityProps.bankAccounts;
					break;
				case 'customers':
					fields = entityProps.customers;
					break;
				case 'currencies':
					fields = entityProps.currencies;
					break;
				case 'disputeStatus':
					fields = entityProps.disputeStatus;
					break;
				case 'employees':
					fields = entityProps.employees;
					break;
				case 'vendors':
					fields = entityProps.vendors;
					break;
				default:
					break;
			}

			return fields;
		},
	}),
};
