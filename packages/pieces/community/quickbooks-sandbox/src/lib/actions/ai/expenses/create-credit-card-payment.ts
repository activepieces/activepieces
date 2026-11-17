import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreateCreditCardPaymentOutputSchema } from '../../../output-schemas';

export const createCreditCardPaymentAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_create_credit_card_payment',
	outputSchema: quickbooksSandboxCreateCreditCardPaymentOutputSchema,
	displayName: 'Create Credit Card Payment',
	description: 'Records a payment toward a credit card balance.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Records a payment from a bank account toward a credit card account\'s balance; for a charge on the card use Create Purchase instead. Both account ids come from List Accounts. Not idempotent: each call records a new payment.',
		idempotent: false,
	},
	props: {
		creditCardAccountId: quickbooksAiProps.id({
			required: true,
			displayName: 'Credit Card Account ID',
			description: 'Id of the credit card account being paid. Use List Accounts (AccountType = \'Credit Card\') to find it.',
		}),
		bankAccountId: quickbooksAiProps.id({
			required: true,
			displayName: 'Bank Account ID',
			description: 'Id of the bank account the payment comes from. Use List Accounts (AccountType = \'Bank\') to find it.',
		}),
		amount: Property.Number({
			displayName: 'Amount',
			description: 'Amount paid to the credit card.',
			required: true,
		}),
		txnDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Transaction Date',
			description: 'Date of the payment, YYYY-MM-DD. Defaults to today.',
		}),
		privateNote: Property.LongText({
			displayName: 'Private Note',
			description: 'Internal memo.',
			required: false,
		}),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const { creditCardAccountId, bankAccountId, amount, txnDate, privateNote, additionalFields } = context.propsValue;
		return await quickbooksApi.createEntity({
			auth: context.auth,
			entity: 'CreditCardPayment',
			body: {
				...additionalFields,
				...quickbooksUtils.compact({
					fields: {
						CreditCardAccountRef: quickbooksUtils.ref({ value: creditCardAccountId }),
						BankAccountRef: quickbooksUtils.ref({ value: bankAccountId }),
						Amount: amount,
						TxnDate: txnDate,
						PrivateNote: privateNote,
					},
				}),
			},
		});
	},
});
