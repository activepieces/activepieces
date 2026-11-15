import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreatePaymentOutputSchema } from '../../../output-schemas';

export const createPaymentAiAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_create_payment',
	outputSchema: quickbooksSandboxCreatePaymentOutputSchema,
	displayName: 'Create Payment',
	description: 'Records a payment received from a customer.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Records a payment received from a customer, optionally applied to invoices (ids from List Invoices) through Lines; without Lines it stays as unapplied credit. Needs the customer id (from List Customers) and the total amount. Not idempotent: each call records a new payment.',
		idempotent: false,
	},
	props: {
		customerId: quickbooksAiProps.id({
			required: true,
			displayName: 'Customer ID',
			description: 'QuickBooks customer id of the payer. Use List Customers to find it.',
		}),
		totalAmount: Property.Number({
			displayName: 'Total Amount',
			description: 'Total amount received.',
			required: true,
		}),
		lines: quickbooksAiProps.lines({
			required: false,
			description:
				'Optional JSON array that applies the payment to open invoices or credit memos, e.g. [{"Amount": 100, "LinkedTxn": [{"TxnId": "130", "TxnType": "Invoice"}]}]. Line amounts may not exceed Total Amount; any rest stays as unapplied credit.',
		}),
		txnDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Transaction Date',
			description: 'Date of the payment, YYYY-MM-DD. Defaults to today.',
		}),
		paymentRefNum: Property.ShortText({
			displayName: 'Payment Reference Number',
			description: 'Check number or other reference for the payment.',
			required: false,
		}),
		paymentMethodId: quickbooksAiProps.id({
			required: false,
			displayName: 'Payment Method ID',
			description: 'QuickBooks payment method id (cash, check, credit card). Use List Payment Methods to find it.',
		}),
		depositToAccountId: quickbooksAiProps.id({
			required: false,
			displayName: 'Deposit To Account ID',
			description: 'Account the payment is deposited to, e.g. a bank account. Use List Accounts to find it. Defaults to Undeposited Funds.',
		}),
		privateNote: Property.LongText({
			displayName: 'Private Note',
			description: 'Internal note, not shown to the customer.',
			required: false,
		}),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const { customerId, totalAmount, lines, txnDate, paymentRefNum, paymentMethodId, depositToAccountId, privateNote, additionalFields } = context.propsValue;
		return await quickbooksApi.createEntity({
			auth: context.auth,
			entity: 'Payment',
			body: {
				...additionalFields,
				...quickbooksUtils.compact({
					fields: {
						CustomerRef: quickbooksUtils.ref({ value: customerId }),
						TotalAmt: totalAmount,
						Line: quickbooksUtils.linesArray({ lines, propName: 'Lines' }),
						TxnDate: txnDate,
						PaymentRefNum: paymentRefNum,
						PaymentMethodRef: quickbooksUtils.ref({ value: paymentMethodId }),
						DepositToAccountRef: quickbooksUtils.ref({ value: depositToAccountId }),
						PrivateNote: privateNote,
					},
				}),
			},
		});
	},
});
