import {
	createAction,
	Property,
	OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { quickbooksAuth } from '../index';
import { QuickbooksEntityResponse, quickbooksCommon } from '../lib/common';
import { QuickbooksCustomer, QuickbooksInvoice, QuickbooksRef } from '../lib/types';

export const createInvoiceAction = createAction({
	auth: quickbooksAuth,
	name: 'create_invoice',
	displayName: 'Create Invoice',
	description: 'Creates an invoice in QuickBooks.',
	props: {
		customerRef: Property.Dropdown({
			displayName: 'Customer',
			required: true,
			refreshers: [],
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						placeholder: 'Connect your account first',
						options: [],
					};
				}
				const { access_token, props } = auth as OAuth2PropertyValue;

				const companyId = props?.['companyId'];
				const apiUrl = quickbooksCommon.getApiUrl(companyId);

				const query = `SELECT Id, DisplayName FROM Customer STARTPOSITION 1 MAXRESULTS 1000`;

				const response = await httpClient.sendRequest<QuickbooksEntityResponse<QuickbooksCustomer>>(
					{
						method: HttpMethod.GET,
						url: `${apiUrl}/query`,
						queryParams: { query: query, minorversion: '70' },
						headers: {
							Authorization: `Bearer ${access_token}`,
							Accept: 'application/json',
						},
					},
				);

				if (response.body.Fault) {
					throw new Error(
						`QuickBooks API Error: ${response.body.Fault.Error.map(
							(e: { Message: string }) => e.Message,
						).join(', ')}`,
					);
				}

				const customers = response.body.QueryResponse?.['Customer'] ?? [];
				return {
					disabled: false,
					options: customers.map((customer) => ({
						label: customer.DisplayName,
						value: customer.Id,
					})),
				};
			},
		}),
		lineItems: Property.Array({
			displayName: 'Line Items',
			description: 'Line items for the invoice',
			required: true,
			properties: {
				description: Property.ShortText({
					displayName: 'Description',
					required: false,
				}),
				amount: Property.Number({
					displayName: 'Amount',
					description: 'Total amount for this line (Exclusive of tax). Required.',
					required: true,
				}),
				detailType: Property.StaticDropdown({
					displayName: 'Detail Type',
					required: true,
					options: {
						options: [{ label: 'Sales Item Line Detail', value: 'SalesItemLineDetail' }],
					},
					defaultValue: 'SalesItemLineDetail',
				}),
				itemId: Property.ShortText({
					displayName: 'Item ID (Product/Service)',
					description:
						'Enter the ID of the Item (Product/Service). Required for SalesItemLineDetail.',
					required: true,
				}),
				quantity: Property.Number({
					displayName: 'Quantity',
					required: false,
				}),
				unitPrice: Property.Number({
					displayName: 'Unit Price',
					description:
						'If specified, Amount will be Qty * UnitPrice. If Amount is also specified, Amount overrides calculation.',
					required: false,
				}),
			},
		}),
		emailStatus: Property.StaticDropdown({
			displayName: 'Email Status',
			description: 'Specify whether the invoice should be emailed after creation.',
			required: false,
			options: {
				options: [
					{ label: 'Not Set (Default - No Email)', value: 'NotSet' },
					{ label: 'Needs To Be Sent', value: 'NeedToSend' },
				],
			},
			defaultValue: 'NotSet',
		}),
		billEmail: Property.ShortText({
			displayName: 'Billing Email Address',
			description:
				'Email address to send the invoice to. Required if Email Status is "Needs To Be Sent". Overrides customer default.',
			required: false,
		}),
		dueDate: Property.DateTime({
			displayName: 'Due Date',
			description:
				'The date when the payment for the invoice is due. If not provided, default term from customer or company is used.',
			required: false,
		}),
		docNumber: Property.ShortText({
			displayName: 'Invoice Number',
			description:
				'Optional reference number for the invoice. If not provided, QuickBooks assigns the next sequential number.',
			required: false,
		}),
		txnDate: Property.DateTime({
			displayName: 'Transaction Date',
			description:
				'The date entered on the transaction. Defaults to the current date if not specified.',
			required: false,
		}),
		privateNote: Property.LongText({
			displayName: 'Private Note (Memo)',
			description: 'Note to self. Does not appear on the invoice sent to the customer.',
			required: false,
		}),
		customerMemo: Property.LongText({
			displayName: 'Customer Memo (Statement Memo)',
			description:
				'Memo to be displayed on the invoice sent to the customer (appears on statement).',
			required: false,
		}),
	},
	async run(context) {
		const { access_token } = context.auth;
		const companyId = context.auth.props?.['companyId'];

		const apiUrl = quickbooksCommon.getApiUrl(companyId);
		const props = context.propsValue;

		if (props['emailStatus'] === 'NeedToSend' && !props['billEmail']) {
			throw new Error('Billing Email Address is required when Email Status is "Needs To Be Sent".');
		}

		const lineItems = (props['lineItems'] as any[]).map((item: any) => {
			if (item['detailType'] === 'SalesItemLineDetail') {
				if (!item['itemId']) {
					throw new Error('Item ID is required for Sales Item Line Detail.');
				}
				return {
					Amount: item['amount'],
					DetailType: item['detailType'],
					Description: item['description'],
					SalesItemLineDetail: {
						ItemRef: { value: item['itemId'] } as QuickbooksRef,
						...(item['quantity'] != null && { Qty: item['quantity'] }),
						...(item['unitPrice'] != null && { UnitPrice: item['unitPrice'] }),
					},
				};
			} else {
				return {
					Amount: item['amount'],
					DetailType: item['detailType'],
					Description: item['description'],
				};
			}
		});

		if (lineItems.length === 0) {
			throw new Error('At least one line item is required to create an invoice.');
		}

		const invoicePayload = {
			Line: lineItems,
			CustomerRef: { value: props['customerRef'] } as QuickbooksRef,
			...(props['emailStatus'] && { EmailStatus: props['emailStatus'] }),
			...(props['billEmail'] && { BillEmail: { Address: props['billEmail'] } }),
			...(props['dueDate'] && { DueDate: props['dueDate'].split('T')[0] }),
			...(props['docNumber'] && { DocNumber: props['docNumber'] }),
			...(props['txnDate'] && { TxnDate: props['txnDate'].split('T')[0] }),
			...(props['privateNote'] && { PrivateNote: props['privateNote'] }),
			...(props['customerMemo'] && { CustomerMemo: { value: props['customerMemo'] } }),
		};

		const response = await httpClient.sendRequest<{
			Invoice: QuickbooksInvoice;
			time: string;
			Fault?: { Error: { Message: string; Detail?: string; code: string }[]; type: string };
		}>({
			method: HttpMethod.POST,
			url: `${apiUrl}/invoice`,
			queryParams: { minorversion: '70' },
			headers: {
				Authorization: `Bearer ${access_token}`,
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			body: invoicePayload,
		});

		if (response.body.Fault) {
			throw new Error(
				`QuickBooks API Error: ${response.body.Fault.Error.map((e: any) => e.Message).join(
					', ',
				)} - ${response.body.Fault.Error.map((e: any) => e.Detail).join(', ')}`,
			);
		}

		return response.body.Invoice;
	},
});
