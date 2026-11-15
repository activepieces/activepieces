import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxDeleteCreditMemoOutputSchema } from '../../../output-schemas';

export const deleteCreditMemoAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_delete_credit_memo',
	outputSchema: quickbooksSandboxDeleteCreditMemoOutputSchema,
	displayName: 'Delete Credit Memo',
	description: 'Permanently deletes a credit memo.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes one credit memo; it cannot be restored. Reads the latest SyncToken first. Get the id from List Credit Memos.',
		idempotent: false,
	},
	props: {
		creditMemoId: quickbooksAiProps.id({
			required: true,
			displayName: 'Credit Memo ID',
			description: 'QuickBooks credit memo id. Use List Credit Memos to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.deleteEntity({
			auth: context.auth,
			entity: 'CreditMemo',
			id: context.propsValue.creditMemoId,
		});
	},
});
