import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxCreateJournalEntryOutputSchema } from '../../../output-schemas';

export const getJournalEntryAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_journal_entry',
	outputSchema: quickbooksSandboxCreateJournalEntryOutputSchema,
	displayName: 'Get Journal Entry',
	description: 'Gets one journal entry by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Reads one journal entry with its debit and credit lines, total and SyncToken. Get the id from List Journal Entries or Create Journal Entry.',
		idempotent: true,
	},
	props: {
		journalEntryId: quickbooksAiProps.id({
			required: true,
			displayName: 'Journal Entry ID',
			description: 'QuickBooks journal entry id. Use List Journal Entries to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.getEntity({
			auth: context.auth,
			entity: 'JournalEntry',
			id: context.propsValue.journalEntryId,
		});
	},
});
