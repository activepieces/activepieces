import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreateTransferOutputSchema } from '../../../output-schemas';

export const updateTransferAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_update_transfer',
	outputSchema: quickbooksSandboxCreateTransferOutputSchema,
	displayName: 'Update Transfer',
	description: 'Changes fields of an existing transfer.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes only the fields you set on one transfer (a sparse update); the latest SyncToken is read first. Get the id from List Transfers and account ids from List Accounts.',
		idempotent: true,
	},
	props: {
		transferId: quickbooksAiProps.id({
			required: true,
			displayName: 'Transfer ID',
			description: 'QuickBooks transfer id. Use List Transfers to find it.',
		}),
		fromAccountId: quickbooksAiProps.id({
			required: false,
			displayName: 'From Account ID',
			description: 'New account the money leaves. Use List Accounts to find it.',
		}),
		toAccountId: quickbooksAiProps.id({
			required: false,
			displayName: 'To Account ID',
			description: 'New account the money goes into. Use List Accounts to find it.',
		}),
		amount: Property.Number({ displayName: 'Amount', description: 'New amount, a positive number.', required: false }),
		txnDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Transaction Date',
			description: 'New date, YYYY-MM-DD.',
		}),
		privateNote: Property.LongText({ displayName: 'Memo', description: 'New internal memo.', required: false }),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const { transferId, fromAccountId, toAccountId, amount, txnDate, privateNote, additionalFields } = context.propsValue;
		return await quickbooksApi.updateEntity({
			auth: context.auth,
			entity: 'Transfer',
			id: transferId,
			requiredFields: ['FromAccountRef', 'ToAccountRef', 'Amount'],
			fields: quickbooksUtils.requireChanges({
				fields: {
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
			}),
		});
	},
});
