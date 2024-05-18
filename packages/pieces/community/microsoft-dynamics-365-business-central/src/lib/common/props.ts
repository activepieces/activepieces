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
				default:
					break;
			}

			return fields;
		},
	}),
};
