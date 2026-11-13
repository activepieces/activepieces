import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreateJournalEntryOutputSchema } from '../../../output-schemas';

export const createJournalEntryAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_create_journal_entry',
	outputSchema: quickbooksSandboxCreateJournalEntryOutputSchema,
	displayName: 'Create Journal Entry',
	description: 'Creates a journal entry.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a journal entry that posts debits and credits directly to accounts (ids from List Accounts); total debits must equal total credits. A line on an Accounts Receivable or Accounts Payable account needs an Entity naming the customer (List Customers) or vendor (List Vendors). Not idempotent: each call posts another entry.',
		idempotent: false,
	},
	props: {
		lines: quickbooksAiProps.lines({
			required: true,
			description:
				'JSON array of QuickBooks journal lines, debits and credits balancing, e.g. [{"DetailType": "JournalEntryLineDetail", "Amount": 100, "Description": "Accrual", "JournalEntryLineDetail": {"PostingType": "Debit", "AccountRef": {"value": "39"}}}, {"DetailType": "JournalEntryLineDetail", "Amount": 100, "JournalEntryLineDetail": {"PostingType": "Credit", "AccountRef": {"value": "35"}}}]. For an A/R or A/P line add "Entity": {"Type": "Customer", "EntityRef": {"value": "58"}} inside JournalEntryLineDetail.',
		}),
		txnDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Transaction Date',
			description: 'Date of the entry, YYYY-MM-DD. Defaults to today.',
		}),
		docNumber: Property.ShortText({
			displayName: 'Journal Number',
			description: 'Reference number of the entry.',
			required: false,
		}),
		privateNote: Property.LongText({ displayName: 'Memo', description: 'Internal memo on the entry.', required: false }),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const { lines, txnDate, docNumber, privateNote, additionalFields } = context.propsValue;
		return await quickbooksApi.createEntity({
			auth: context.auth,
			entity: 'JournalEntry',
			body: {
				...additionalFields,
				...quickbooksUtils.compact({
					fields: {
						Line: quickbooksUtils.linesArray({ lines, propName: 'Lines' }),
						TxnDate: txnDate,
						DocNumber: docNumber,
						PrivateNote: privateNote,
					},
				}),
			},
		});
	},
});
