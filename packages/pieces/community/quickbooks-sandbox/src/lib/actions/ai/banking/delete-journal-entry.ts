import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxDeleteJournalEntryOutputSchema } from '../../../output-schemas';

export const deleteJournalEntryAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_delete_journal_entry',
	outputSchema: quickbooksSandboxDeleteJournalEntryOutputSchema,
	displayName: 'Delete Journal Entry',
	description: 'Permanently deletes a journal entry.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes one journal entry; it cannot be restored. Reads the latest SyncToken first. Get the id from List Journal Entries.',
		idempotent: false,
	},
	props: {
		journalEntryId: quickbooksAiProps.id({
			required: true,
			displayName: 'Journal Entry ID',
			description: 'QuickBooks journal entry id. Use List Journal Entries to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.deleteEntity({
			auth: context.auth,
			entity: 'JournalEntry',
			id: context.propsValue.journalEntryId,
		});
	},
});
