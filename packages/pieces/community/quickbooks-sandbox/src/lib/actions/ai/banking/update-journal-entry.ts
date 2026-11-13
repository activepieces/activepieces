import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxUpdateJournalEntryOutputSchema } from '../../../output-schemas';

export const updateJournalEntryAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_update_journal_entry',
	outputSchema: quickbooksSandboxUpdateJournalEntryOutputSchema,
	displayName: 'Update Journal Entry',
	description: 'Changes fields of an existing journal entry.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes only the fields you set on one journal entry (a sparse update); the latest SyncToken is read first. Setting Lines replaces all existing lines, so pass the full balanced list (from Get Journal Entry) with your changes. Get the id from List Journal Entries.',
		idempotent: true,
	},
	props: {
		journalEntryId: quickbooksAiProps.id({
			required: true,
			displayName: 'Journal Entry ID',
			description: 'QuickBooks journal entry id. Use List Journal Entries to find it.',
		}),
		lines: quickbooksAiProps.lines({
			required: false,
			description:
				'JSON array that replaces every line; debits must equal credits, e.g. [{"DetailType": "JournalEntryLineDetail", "Amount": 100, "JournalEntryLineDetail": {"PostingType": "Debit", "AccountRef": {"value": "39"}}}, {"DetailType": "JournalEntryLineDetail", "Amount": 100, "JournalEntryLineDetail": {"PostingType": "Credit", "AccountRef": {"value": "35"}}}].',
		}),
		txnDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Transaction Date',
			description: 'New date, YYYY-MM-DD.',
		}),
		docNumber: Property.ShortText({ displayName: 'Journal Number', description: 'New reference number.', required: false }),
		privateNote: Property.LongText({ displayName: 'Memo', description: 'New internal memo.', required: false }),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const { journalEntryId, lines, txnDate, docNumber, privateNote, additionalFields } = context.propsValue;
		return await quickbooksApi.updateEntity({
			auth: context.auth,
			entity: 'JournalEntry',
			id: journalEntryId,
			fields: quickbooksUtils.requireChanges({
				fields: {
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
			}),
		});
	},
});
