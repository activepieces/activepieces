import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreateDepositOutputSchema } from '../../../output-schemas';

export const createDepositAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_create_deposit',
	outputSchema: quickbooksSandboxCreateDepositOutputSchema,
	displayName: 'Create Deposit',
	description: 'Records a deposit into a bank account.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Records a bank deposit into one account (id from List Accounts), from income lines or from received payments sitting in Undeposited Funds (payment ids from List Payments, linked through LinkedTxn). Not idempotent: each call records another deposit.',
		idempotent: false,
	},
	props: {
		depositToAccountId: quickbooksAiProps.id({
			required: true,
			displayName: 'Deposit To Account ID',
			description: 'Bank or other current asset account the money goes into. Use List Accounts to find it.',
		}),
		lines: quickbooksAiProps.lines({
			required: true,
			description:
				'JSON array of QuickBooks deposit lines, e.g. [{"DetailType": "DepositLineDetail", "Amount": 200, "Description": "Cash sale", "DepositLineDetail": {"AccountRef": {"value": "79"}}}]. To deposit a received payment, link it instead: [{"Amount": 50, "LinkedTxn": [{"TxnId": "123", "TxnType": "Payment", "TxnLineId": "0"}]}].',
		}),
		txnDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Transaction Date',
			description: 'Date of the deposit, YYYY-MM-DD. Defaults to today.',
		}),
		privateNote: Property.LongText({ displayName: 'Memo', description: 'Internal memo on the deposit.', required: false }),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const { depositToAccountId, lines, txnDate, privateNote, additionalFields } = context.propsValue;
		return await quickbooksApi.createEntity({
			auth: context.auth,
			entity: 'Deposit',
			body: {
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
		});
	},
});
