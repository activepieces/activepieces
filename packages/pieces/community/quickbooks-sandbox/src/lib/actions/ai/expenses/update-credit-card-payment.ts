import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxUpdateCreditCardPaymentOutputSchema } from '../../../output-schemas';

export const updateCreditCardPaymentAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_update_credit_card_payment',
	outputSchema: quickbooksSandboxUpdateCreditCardPaymentOutputSchema,
	displayName: 'Update Credit Card Payment',
	description: 'Changes fields of an existing credit card payment.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes only the fields you set on one credit card payment (a sparse update); the latest SyncToken is read first. Get the id from List Credit Card Payments and account ids from List Accounts.',
		idempotent: true,
	},
	props: {
		creditCardPaymentId: quickbooksAiProps.id({
			required: true,
			displayName: 'Credit Card Payment ID',
			description: 'QuickBooks credit card payment id. Use List Credit Card Payments to find it.',
		}),
		creditCardAccountId: quickbooksAiProps.id({
			required: false,
			displayName: 'Credit Card Account ID',
			description: 'New credit card account id. Use List Accounts to find it.',
		}),
		bankAccountId: quickbooksAiProps.id({
			required: false,
			displayName: 'Bank Account ID',
			description: 'New bank account id. Use List Accounts to find it.',
		}),
		amount: Property.Number({ displayName: 'Amount', description: 'New amount.', required: false }),
		txnDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Transaction Date',
			description: 'New date, YYYY-MM-DD.',
		}),
		privateNote: Property.LongText({ displayName: 'Private Note', description: 'New internal memo.', required: false }),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const { creditCardPaymentId, creditCardAccountId, bankAccountId, amount, txnDate, privateNote, additionalFields } =
			context.propsValue;
		return await quickbooksApi.updateEntity({
			auth: context.auth,
			entity: 'CreditCardPayment',
			id: creditCardPaymentId,
			requiredFields: ['CreditCardAccountRef', 'BankAccountRef', 'Amount'],
			fields: quickbooksUtils.requireChanges({
				fields: {
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
			}),
		});
	},
});
