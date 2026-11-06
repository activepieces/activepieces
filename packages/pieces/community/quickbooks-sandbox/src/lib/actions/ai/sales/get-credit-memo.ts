import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxCreateCreditMemoOutputSchema } from '../../../output-schemas';

export const getCreditMemoAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_credit_memo',
	outputSchema: quickbooksSandboxCreateCreditMemoOutputSchema,
	displayName: 'Get Credit Memo',
	description: 'Gets one credit memo by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Reads one credit memo with its lines, totals, remaining credit and SyncToken. Get the id from List Credit Memos or Create Credit Memo.',
		idempotent: true,
	},
	props: {
		creditMemoId: quickbooksAiProps.id({
			required: true,
			displayName: 'Credit Memo ID',
			description: 'QuickBooks credit memo id. Use List Credit Memos to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.getEntity({
			auth: context.auth,
			entity: 'CreditMemo',
			id: context.propsValue.creditMemoId,
		});
	},
});
