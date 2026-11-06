import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxDeleteTransferOutputSchema } from '../../../output-schemas';

export const deleteTransferAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_delete_transfer',
	outputSchema: quickbooksSandboxDeleteTransferOutputSchema,
	displayName: 'Delete Transfer',
	description: 'Permanently deletes a transfer.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes one transfer; it cannot be restored. Reads the latest SyncToken first. Get the id from List Transfers.',
		idempotent: false,
	},
	props: {
		transferId: quickbooksAiProps.id({
			required: true,
			displayName: 'Transfer ID',
			description: 'QuickBooks transfer id. Use List Transfers to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.deleteEntity({
			auth: context.auth,
			entity: 'Transfer',
			id: context.propsValue.transferId,
		});
	},
});
