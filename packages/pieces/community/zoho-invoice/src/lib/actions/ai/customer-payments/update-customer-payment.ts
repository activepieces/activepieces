import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoicePaymentOutputSchema } from '../../../output-schemas';

export const updateCustomerPaymentAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_update_customer_payment',
	outputSchema: zohoInvoicePaymentOutputSchema,
	displayName: 'Update Customer Payment',
	description: 'Changes a customer payment or how it is applied to invoices.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes a customer payment. Fields left empty keep their current value; when Invoices is empty the current invoice allocation is resent and re-applied as-is. Use List Customer Payments to find the ID; use Update Customer Payment Custom Fields to change only custom fields.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		paymentId: zohoInvoiceAiProps.paymentId({ required: true }),
		customerId: zohoInvoiceAiProps.contactId({
			required: false,
			displayName: 'Customer ID',
			description: 'New customer ID. Use List Contacts to find it. Empty = unchanged.',
		}),
		paymentMode: Property.ShortText({
			displayName: 'Payment Mode',
			description:
				'New payment mode: check, cash, creditcard, banktransfer, bankremittance, autotransaction or others. Empty = unchanged.',
			required: false,
		}),
		amount: Property.Number({
			displayName: 'Amount',
			description: 'New total amount received. Empty = unchanged.',
			required: false,
		}),
		date: Property.ShortText({
			displayName: 'Date',
			description: 'New payment date, yyyy-mm-dd. Empty = unchanged.',
			required: false,
		}),
		invoices: Property.Array({
			displayName: 'Invoices',
			description:
				'Full new allocation of the payment to invoices. Empty = current allocation unchanged.',
			required: false,
			properties: {
				invoiceId: zohoInvoiceAiProps.invoiceId({ required: true }),
				invoicePaymentId: zohoInvoiceAiProps.idProp({
					required: false,
					displayName: 'Invoice Payment ID',
					description:
						'ID of an existing allocation to change. Use Get Customer Payment to find it. Empty = a new allocation.',
				}),
				amountApplied: Property.Number({
					displayName: 'Amount Applied',
					description: 'Amount of the payment applied to this invoice.',
					required: true,
				}),
			},
		}),
		referenceNumber: Property.ShortText({
			displayName: 'Reference Number',
			description: 'New reference number. Empty = unchanged.',
			required: false,
		}),
		description: Property.ShortText({
			displayName: 'Description',
			description: 'New description. Empty = unchanged.',
			required: false,
		}),
		bankCharges: Property.Number({
			displayName: 'Bank Charges',
			description: 'New bank charges. Empty = unchanged.',
			required: false,
		}),
		additionalFields: zohoInvoiceAiProps.additionalFields({ required: false }),
	},
	async run({ auth, propsValue }) {
		const { organizationId, paymentId } = propsValue;
		const current = await zohoInvoiceApi.getCustomerPayment({ auth, organizationId, paymentId });
		return await zohoInvoiceApi.updateCustomerPayment({
			auth,
			organizationId,
			paymentId,
			body: {
				...zohoInvoiceUtils.compact({
					customer_id: current.payment?.customer_id,
					payment_mode: current.payment?.payment_mode,
					amount: current.payment?.amount,
					date: current.payment?.date,
					invoices: current.payment?.invoices?.map((invoice) =>
						zohoInvoiceUtils.compact({
							invoice_id: invoice.invoice_id,
							invoice_payment_id: invoice.invoice_payment_id,
							amount_applied: invoice.amount_applied,
						}),
					),
				}),
				...(propsValue.additionalFields ?? {}),
				...zohoInvoiceUtils.compact({
					customer_id: propsValue.customerId,
					payment_mode: propsValue.paymentMode,
					amount: propsValue.amount,
					date: propsValue.date,
					invoices: propsValue.invoices?.length
						? zohoInvoiceUtils
								.toRecords({ rows: propsValue.invoices, propName: 'Invoices' })
								.map((invoice) =>
									zohoInvoiceUtils.compact({
										invoice_id: invoice['invoiceId'],
										invoice_payment_id: invoice['invoicePaymentId'],
										amount_applied: invoice['amountApplied'],
									}),
								)
						: undefined,
					reference_number: propsValue.referenceNumber,
					description: propsValue.description,
					bank_charges: propsValue.bankCharges,
				}),
			},
		});
	},
});
