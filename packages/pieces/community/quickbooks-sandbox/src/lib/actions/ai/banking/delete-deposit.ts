import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxDeleteDepositOutputSchema } from '../../../output-schemas';

export const deleteDepositAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_delete_deposit',
	outputSchema: quickbooksSandboxDeleteDepositOutputSchema,
	displayName: 'Delete Deposit',
	description: 'Permanently deletes a deposit.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes one deposit; it cannot be restored. Reads the latest SyncToken first. Get the id from List Deposits.',
		idempotent: false,
	},
	props: {
		depositId: quickbooksAiProps.id({
			required: true,
			displayName: 'Deposit ID',
			description: 'QuickBooks deposit id. Use List Deposits to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.deleteEntity({
			auth: context.auth,
			entity: 'Deposit',
			id: context.propsValue.depositId,
		});
	},
});
