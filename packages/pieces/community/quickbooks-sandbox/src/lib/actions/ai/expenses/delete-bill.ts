import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxDeleteBillOutputSchema } from '../../../output-schemas';

export const deleteBillAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_delete_bill',
	outputSchema: quickbooksSandboxDeleteBillOutputSchema,
	displayName: 'Delete Bill',
	description: 'Permanently deletes a bill.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes one bill; it cannot be restored. Reads the latest SyncToken first. Get the id from List Bills.',
		idempotent: false,
	},
	props: {
		billId: quickbooksAiProps.id({
			required: true,
			displayName: 'Bill ID',
			description: 'QuickBooks bill id. Use List Bills to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.deleteEntity({
			auth: context.auth,
			entity: 'Bill',
			id: context.propsValue.billId,
		});
	},
});
