import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreateDepositOutputSchema } from '../../../output-schemas';

export const updateDepositAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_update_deposit',
	outputSchema: quickbooksSandboxCreateDepositOutputSchema,
	displayName: 'Update Deposit',
	description: 'Changes fields of an existing deposit.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes only the fields you set on one deposit (a sparse update); the latest SyncToken is read first. Setting Lines replaces all existing lines, so pass the full list (from Get Deposit) with your changes. Get the id from List Deposits.',
		idempotent: true,
	},
	props: {
		depositId: quickbooksAiProps.id({
			required: true,
			displayName: 'Deposit ID',
			description: 'QuickBooks deposit id. Use List Deposits to find it.',
		}),
		depositToAccountId: quickbooksAiProps.id({
			required: false,
			displayName: 'Deposit To Account ID',
			description: 'New bank or other current asset account. Use List Accounts to find it.',
		}),
		lines: quickbooksAiProps.lines({
			required: false,
			description:
				'JSON array that replaces every line, in QuickBooks deposit line format, e.g. [{"DetailType": "DepositLineDetail", "Amount": 200, "DepositLineDetail": {"AccountRef": {"value": "79"}}}].',
		}),
		txnDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Transaction Date',
			description: 'New date, YYYY-MM-DD.',
		}),
		privateNote: Property.LongText({ displayName: 'Memo', description: 'New internal memo.', required: false }),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const { depositId, depositToAccountId, lines, txnDate, privateNote, additionalFields } = context.propsValue;
		return await quickbooksApi.updateEntity({
			auth: context.auth,
			entity: 'Deposit',
			id: depositId,
			requiredFields: ['DepositToAccountRef'],
			fields: quickbooksUtils.requireChanges({
				fields: {
					...additionalFields,
					...quickbooksUtils.compact({
						fields: {
							DepositToAccountRef: quickbooksUtils.ref({ value: depositToAccountId }),
							Line: quickbooksUtils.linesArray({ lines, propName: 'Lines' }),
							TxnDate: txnDate,
							PrivateNote: privateNote,
						},
					}),
				},
			}),
		});
	},
});
