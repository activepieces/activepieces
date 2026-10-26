import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceListCustomerPaymentsOutputSchema } from '../../../output-schemas';

export const listCustomerPaymentsAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_customer_payments',
	outputSchema: zohoInvoiceListCustomerPaymentsOutputSchema,
	displayName: 'List Customer Payments',
	description: 'Lists payments received from customers, one page at a time.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists customer payments with payment_id, customer, amount, mode, date and the invoices paid, one page at a time. Filter by payment mode or date, or search by reference, customer name or description.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		filterBy: Property.StaticDropdown({
			displayName: 'Payment Mode',
			description: 'Only payments made this way. Empty = all.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'All', value: 'PaymentMode.All' },
					{ label: 'Check', value: 'PaymentMode.Check' },
					{ label: 'Cash', value: 'PaymentMode.Cash' },
					{ label: 'Bank Transfer', value: 'PaymentMode.BankTransfer' },
					{ label: 'PayPal', value: 'PaymentMode.Paypal' },
					{ label: 'Credit Card', value: 'PaymentMode.CreditCard' },
					{ label: 'Google Checkout', value: 'PaymentMode.GoogleCheckout' },
					{ label: 'Credit', value: 'PaymentMode.Credit' },
					{ label: 'Authorize.Net', value: 'PaymentMode.Authorizenet' },
					{ label: 'Bank Remittance', value: 'PaymentMode.BankRemittance' },
					{ label: 'Payflow Pro', value: 'PaymentMode.Payflowpro' },
					{ label: 'Stripe', value: 'PaymentMode.Stripe' },
					{ label: '2Checkout', value: 'PaymentMode.TwoCheckout' },
					{ label: 'Braintree', value: 'PaymentMode.Braintree' },
					{ label: 'Others', value: 'PaymentMode.Others' },
				],
			},
		}),
		date: Property.ShortText({
			displayName: 'Date',
			description: 'Only payments made on this day, yyyy-mm-dd.',
			required: false,
		}),
		searchText: zohoInvoiceAiProps.searchText({
			required: false,
			description: 'Search by reference number, customer name or payment description.',
		}),
		sortColumn: zohoInvoiceAiProps.sortColumn({
			required: false,
			description: 'Field to sort by, e.g. date, customer_name, amount or reference_number.',
		}),
		page: zohoInvoiceAiProps.page({ required: false }),
		perPage: zohoInvoiceAiProps.perPage({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.listCustomerPayments({
			auth,
			organizationId: propsValue.organizationId,
			filterBy: propsValue.filterBy,
			date: propsValue.date,
			searchText: propsValue.searchText,
			sortColumn: propsValue.sortColumn,
			page: propsValue.page,
			perPage: propsValue.perPage,
		});
	},
});
