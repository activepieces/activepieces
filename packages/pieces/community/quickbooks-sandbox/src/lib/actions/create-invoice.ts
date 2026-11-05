import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { quickbooksAuth } from '../auth';
import { quickbooksClient } from '../common/client';
import { quickbooksProps } from '../common/props';
import type { QuickbooksFault, QuickbooksInvoice } from '../common/types';
import { createInvoiceOutputSchema } from '../output-schemas';

export const createInvoiceAction = createAction({
	auth: quickbooksAuth,
	name: 'create_invoice',
	outputSchema: createInvoiceOutputSchema,
	displayName: 'Create Invoice',
	description: 'Creates an invoice in QuickBooks.',
	audience: 'human',
	aiMetadata: {
		description: 'Create a new QuickBooks invoice for a customer with one or more line items (each line needs an amount and an Item/product Id). Optionally set due date, transaction date, invoice number, memos, and email status; setting email status to "Needs To Be Sent" requires a billing email. Not idempotent: each call creates a new invoice, so guard against duplicates.',
		idempotent: false,
	},
	props: {
		customerRef: quickbooksProps.customerRef({ required: true }),
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
		const props = context.propsValue;

		if (props['emailStatus'] === 'NeedToSend' && !props['billEmail']) {
			throw new Error('Billing Email Address is required when Email Status is "Needs To Be Sent".');
		}

		const lineItems = (props['lineItems'] as {
			description?: string;
			amount: number;
			detailType: string;
			itemId?: string;
			quantity?: number | null;
			unitPrice?: number | null;
		}[]).map((item) => {
			if (item['detailType'] === 'SalesItemLineDetail') {
				if (!item['itemId']) {
					throw new Error('Item ID is required for Sales Item Line Detail.');
				}
				return {
					Amount: item['amount'],
					DetailType: item['detailType'],
					Description: item['description'],
					SalesItemLineDetail: {
						ItemRef: { value: item['itemId'] },
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
			CustomerRef: { value: props['customerRef'] },
			...(props['emailStatus'] && { EmailStatus: props['emailStatus'] }),
			...(props['billEmail'] && { BillEmail: { Address: props['billEmail'] } }),
			...(props['dueDate'] && { DueDate: props['dueDate'].split('T')[0] }),
			...(props['docNumber'] && { DocNumber: props['docNumber'] }),
			...(props['txnDate'] && { TxnDate: props['txnDate'].split('T')[0] }),
			...(props['privateNote'] && { PrivateNote: props['privateNote'] }),
			...(props['customerMemo'] && { CustomerMemo: { value: props['customerMemo'] } }),
		};

		const response = await quickbooksClient.request<{
			Invoice: QuickbooksInvoice;
			time: string;
			Fault?: QuickbooksFault;
		}>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: '/invoice',
			body: invoicePayload,
		});

		if (response.Fault) {
			throw new Error(
				`QuickBooks API Error: ${response.Fault.Error.map((e) => e.Message).join(
					', ',
				)} - ${response.Fault.Error.map((e) => e.Detail).join(', ')}`,
			);
		}

		return response.Invoice;
	},
});
