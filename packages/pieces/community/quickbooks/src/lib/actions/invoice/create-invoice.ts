import { quickBooksAuth } from '../../../';
import { Property, createAction } from '@activepieces/pieces-framework';
import { quickBooksCommon } from '../../common';
import { CreateInvoiceParameters } from '../../common/types';
import { QuickBooksAPIClient } from '../../common/client';

export const createInvoiceAction = createAction({
	auth: quickBooksAuth,
	name: 'quickbooks_create_invoice',
	displayName: 'Create Invoice',
	description: 'Adds a new invoice(with line item support).',
	props: {
		customerId: quickBooksCommon.customerId(true, 'Customer'),
		BillEmail: Property.ShortText({
			displayName: 'Bill Email',
			required: false,
		}),
		BillEmailCc: Property.ShortText({
			displayName: 'Cc',
			required: false,
		}),
		BillEmailBcc: Property.ShortText({
			displayName: 'Bcc',
			required: false,
		}),
		lineItems: Property.Array({
			displayName: 'Line Items',
			required: true,
			properties: {
				ServiceDate: Property.ShortText({
					displayName: 'Service Date',
					required: false,
				}),
				ItemRef: quickBooksCommon.itemId(false, 'Product/Service'),
				Description: Property.LongText({
					displayName: 'Description',
					required: false,
				}),
				Qty: Property.Number({
					displayName: 'Quantity',
					required: false,
					defaultValue: 1,
				}),
				Amount: Property.Number({
					displayName: 'Amount',
					required: true,
				}),
				UnitPrice: Property.Number({
					displayName: 'Unit Price',
					required: false,
				}),
				ClassRef: quickBooksCommon.classId(false, 'Class'),
				TaxCodeRef: quickBooksCommon.taxCodeId(false, 'Tax'),
			},
		}),
		SalesTermRef: quickBooksCommon.termId(false, 'Terms'),
		TxnDate: Property.DateTime({
			displayName: 'Invoice Date',
			description: 'Please use yyyy/MM/dd format.',
			required: false,
		}),
		DueDate: Property.DateTime({
			displayName: 'Due Date',
			description: 'Please use yyyy/MM/dd format.',
			required: false,
		}),
		ShipDate: Property.DateTime({
			displayName: 'Shipping Date',
			description: 'Please use yyyy/MM/dd format.',
			required: false,
		}),
		TrackingNum: Property.ShortText({
			displayName: 'Tracking Number',
			required: false,
		}),
		CustomerMemo: Property.LongText({
			displayName: 'Message on Invoice',
			required: false,
		}),
		PrivateNote: Property.LongText({
			displayName: 'Message on Statement',
			required: false,
		}),
	},
	async run(context) {
		const lineItems = context.propsValue.lineItems as LineItemsInput[];
		const formatedLineItems = lineItems.map((item) => {
			return {
				DetailType: 'SalesItemLineDetail',
				Amount: Number(item.Amount) ?? undefined,
				Description: item.Description,
				SalesItemLineDetail: {
					ItemRef: item.ItemRef
						? {
								value: item.ItemRef,
						  }
						: undefined,
					Qty: Number(item.Qty) ?? undefined,
					ServiceDate: item.ServiceDate,
					UnitPrice: Number(item.UnitPrice) ?? undefined,
					ClassRef: item.ClassRef
						? {
								value: item.ClassRef,
						  }
						: undefined,
					TaxCodeRef: item.TaxCodeRef
						? {
								value: item.TaxCodeRef,
						  }
						: undefined,
				},
			};
		});

		const params: CreateInvoiceParameters = {
			CustomerRef: {
				value: context.propsValue.customerId!,
			},
			BillEmail: context.propsValue.BillEmail
				? {
						Address: context.propsValue.BillEmail,
				  }
				: undefined,
			BillEmailCc: context.propsValue.BillEmailCc
				? {
						Address: context.propsValue.BillEmailCc,
				  }
				: undefined,
			BillEmailBcc: context.propsValue.BillEmailBcc
				? {
						Address: context.propsValue.BillEmailBcc,
				  }
				: undefined,
			Line: formatedLineItems,
			TxnDate: context.propsValue.TxnDate,
			DueDate: context.propsValue.DueDate,
			ShipDate: context.propsValue.ShipDate,
			TrackingNum: context.propsValue.TrackingNum,
			CustomerMemo: context.propsValue.CustomerMemo
				? {
						value: context.propsValue.CustomerMemo,
				  }
				: undefined,
			PrivateNote: context.propsValue.PrivateNote,
		};

		const client = new QuickBooksAPIClient({
			accessToken: context.auth.access_token,
			companyId: context.auth.props?.['companyId'],
		});
		return await client.invoices.create(params);
	},
});

type LineItemsInput = {
	ServiceDate?: string;
	ItemRef?: string;
	Description?: string;
	Qty?: string;
	Amount?: string;
	UnitPrice?: string;
	ClassRef?: string;
	TaxCodeRef?: string;
};
