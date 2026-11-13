import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreateTransferOutputSchema } from '../../../output-schemas';

export const createTransferAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_create_transfer',
	outputSchema: quickbooksSandboxCreateTransferOutputSchema,
	displayName: 'Create Transfer',
	description: 'Moves money between two accounts.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Records a transfer of an amount from one balance sheet account to another, such as between two bank accounts or from a bank to a credit card. Both account ids come from List Accounts. Not idempotent: each call records another transfer.',
		idempotent: false,
	},
	props: {
		fromAccountId: quickbooksAiProps.id({
			required: true,
			displayName: 'From Account ID',
			description: 'Account the money leaves. Use List Accounts to find it.',
		}),
		toAccountId: quickbooksAiProps.id({
			required: true,
			displayName: 'To Account ID',
			description: 'Account the money goes into. Use List Accounts to find it.',
		}),
		amount: Property.Number({ displayName: 'Amount', description: 'Amount transferred, a positive number.', required: true }),
		txnDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Transaction Date',
			description: 'Date of the transfer, YYYY-MM-DD. Defaults to today.',
		}),
		privateNote: Property.LongText({ displayName: 'Memo', description: 'Internal memo on the transfer.', required: false }),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const { fromAccountId, toAccountId, amount, txnDate, privateNote, additionalFields } = context.propsValue;
		return await quickbooksApi.createEntity({
			auth: context.auth,
			entity: 'Transfer',
			body: {
				...additionalFields,
				...quickbooksUtils.compact({
					fields: {
						FromAccountRef: quickbooksUtils.ref({ value: fromAccountId }),
						ToAccountRef: quickbooksUtils.ref({ value: toAccountId }),
						Amount: amount,
						TxnDate: txnDate,
						PrivateNote: privateNote,
					},
				}),
			},
		});
	},
});
