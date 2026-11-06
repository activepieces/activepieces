import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoicePaymentOutputSchema } from '../../../output-schemas';

export const createCustomerPaymentAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_create_customer_payment',
	outputSchema: zohoInvoicePaymentOutputSchema,
	displayName: 'Create Customer Payment',
	description: 'Records a payment received from a customer.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Records a payment received from a customer and applies it to that customer's invoices; any amount not applied stays as excess credit. Use List Contacts for the customer ID and List Invoices for the invoice IDs. Not idempotent: each call records another payment.",
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		customerId: zohoInvoiceAiProps.contactId({ required: true, displayName: 'Customer ID' }),
		paymentMode: Property.ShortText({
			displayName: 'Payment Mode',
			description:
				'How the customer paid: check, cash, creditcard, banktransfer, bankremittance, autotransaction or others.',
			required: true,
		}),
		amount: Property.Number({
			displayName: 'Amount',
			description: 'Total amount received.',
			required: true,
		}),
		date: Property.ShortText({
			displayName: 'Date',
			description: 'Payment date, yyyy-mm-dd.',
			required: true,
		}),
		invoices: Property.Array({
			displayName: 'Invoices',
			description: 'Invoices this payment pays and the amount applied to each.',
			required: true,
			properties: {
				invoiceId: zohoInvoiceAiProps.invoiceId({ required: true }),
				amountApplied: Property.Number({
					displayName: 'Amount Applied',
					description: 'Amount of the payment applied to this invoice.',
					required: true,
				}),
			},
		}),
		referenceNumber: Property.ShortText({
			displayName: 'Reference Number',
			description: 'Your own reference, e.g. a check or transaction number.',
			required: false,
		}),
		description: Property.ShortText({
			displayName: 'Description',
			description: 'Note about the payment.',
			required: false,
		}),
		bankCharges: Property.Number({
			displayName: 'Bank Charges',
			description: 'Bank fees deducted from the payment.',
			required: false,
		}),
		additionalFields: zohoInvoiceAiProps.additionalFields({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.createCustomerPayment({
			auth,
			organizationId: propsValue.organizationId,
			body: {
				...(propsValue.additionalFields ?? {}),
				...zohoInvoiceUtils.compact({
					customer_id: propsValue.customerId,
					payment_mode: propsValue.paymentMode,
					amount: propsValue.amount,
					date: propsValue.date,
					invoices: zohoInvoiceUtils
						.toRecords({ rows: propsValue.invoices, propName: 'Invoices' })
						.map((invoice) =>
							zohoInvoiceUtils.compact({
								invoice_id: invoice['invoiceId'],
								amount_applied: invoice['amountApplied'],
							}),
						),
					reference_number: propsValue.referenceNumber,
					description: propsValue.description,
					bank_charges: propsValue.bankCharges,
				}),
			},
		});
	},
});
