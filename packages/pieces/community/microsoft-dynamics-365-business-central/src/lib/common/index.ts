import { businessCentralAuth } from '../..';
import {
	DropdownOption,
	DynamicPropsValue,
	PiecePropValueSchema,
	Property,
} from '@activepieces/pieces-framework';
import { makeClient } from './client';
import { ENTITY_DROPDOWN_OPTIONS } from './constants';
import { customersEntityProps } from './props/customers.entity';
import { bankAccountsEntityProps } from './props/bankAccounts.entity';
import { contactsEntityProps } from './props/contacts.entity';
import { currenciesEntityProps } from './props/currencies.entity';
import { disputeStatusEntityProps } from './props/disputeStatus.entity';
import { employeesEntityProps } from './props/employees.entity';
import { vendorsEntityProps } from './props/vendors.entity';
import { journalsEntityProps } from './props/journals.entity';
import { locationsEntityProps } from './props/locations.entity';
import { paymentMethodsEntityProps } from './props/paymentMethods.entity';
import { paymentTermsEntityProps } from './props/paymentTerms.entity';
import { projectsEntityProps } from './props/projects.entity';
import { itemCategoriesEntityProps } from './props/itemCategories.entity';
import { itemsEntityProps } from './props/items.entity';
import { itemVariantsEntityProps } from './props/itemVariants.entity';
import { salesOrdersEntityProps } from './props/salesOrders.entity';
import { salesOrderLinesEntityProps } from './props/salesOrderLines.entity';
import { salesInvoiceLinesEntityProps } from './props/salesInvoiceLines.entity';
import { salesInvoicesEntityProps } from './props/salesInvoices.entity';
import { salesQuoteLinesEntityProps } from './props/salesQuoteLines.entity';
import { salesQuotesEntityProps } from './props/salesQuotes.entity';
import { shipmentMethodsEntityProps } from './props/shipmentMethods.entity';

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
					fields = customersEntityProps;
					break;
				case 'bankAccounts':
					fields = bankAccountsEntityProps;
					break;
				case 'contacts':
					fields = contactsEntityProps;
					break;
				case 'currencies':
					fields = currenciesEntityProps;
					break;
				case 'disputeStatus':
					fields = disputeStatusEntityProps;
					break;
				case 'employees':
					fields = employeesEntityProps;
					break;
				case 'items':
					fields = itemsEntityProps;
					break;
				case 'itemCategories':
					fields = itemCategoriesEntityProps;
					break;
				case 'itemVariants':
					fields = itemVariantsEntityProps;
					break;
				case 'journals':
					fields = journalsEntityProps;
					break;
				case 'locations':
					fields = locationsEntityProps;
					break;
				case 'paymentMethods':
					fields = paymentMethodsEntityProps;
					break;
				case 'paymentTerms':
					fields = paymentTermsEntityProps;
					break;
				case 'projects':
					fields = projectsEntityProps;
					break;
				case 'salesInvoices':
					fields = salesInvoicesEntityProps;
					break;
				case 'salesInvoiceLines':
					fields = salesInvoiceLinesEntityProps;
					break;
				case 'salesOrders':
					fields = salesOrdersEntityProps;
					break;
				case 'salesOrderLines':
					fields = salesOrderLinesEntityProps;
					break;
				case 'salesQuotes':
					fields = salesQuotesEntityProps;
					break;
				case 'salesQuoteLines':
					fields = salesQuoteLinesEntityProps;
					break;
				case 'shipmentMethods':
					fields = shipmentMethodsEntityProps;
					break;
				case 'vendors':
					fields = vendorsEntityProps;
					break;
				default:
					break;
			}

			return fields;
		},
	}),
};
