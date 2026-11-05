import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxDeleteEstimateOutputSchema } from '../../../output-schemas';

export const deleteEstimateAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_delete_estimate',
	outputSchema: quickbooksSandboxDeleteEstimateOutputSchema,
	displayName: 'Delete Estimate',
	description: 'Permanently deletes an estimate.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes one estimate; it cannot be restored. Reads the latest SyncToken first. Get the id from List Estimates.',
		idempotent: false,
	},
	props: {
		estimateId: quickbooksAiProps.id({
			required: true,
			displayName: 'Estimate ID',
			description: 'QuickBooks estimate id. Use List Estimates to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.deleteEntity({
			auth: context.auth,
			entity: 'Estimate',
			id: context.propsValue.estimateId,
		});
	},
});
