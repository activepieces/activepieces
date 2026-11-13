import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxCreateEstimateOutputSchema } from '../../../output-schemas';

export const getEstimateAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_estimate',
	outputSchema: quickbooksSandboxCreateEstimateOutputSchema,
	displayName: 'Get Estimate',
	description: 'Gets one estimate by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Reads one estimate with its lines, totals, status (TxnStatus) and SyncToken. Get the id from List Estimates or Create Estimate.',
		idempotent: true,
	},
	props: {
		estimateId: quickbooksAiProps.id({
			required: true,
			displayName: 'Estimate ID',
			description: 'QuickBooks estimate id. Use List Estimates to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.getEntity({
			auth: context.auth,
			entity: 'Estimate',
			id: context.propsValue.estimateId,
		});
	},
});
