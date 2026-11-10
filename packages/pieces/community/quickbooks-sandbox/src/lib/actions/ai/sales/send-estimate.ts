import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxSendEstimateOutputSchema } from '../../../output-schemas';

export const sendEstimateAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_send_estimate',
	outputSchema: quickbooksSandboxSendEstimateOutputSchema,
	displayName: 'Send Estimate',
	description: 'Emails an estimate to the customer.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Emails one estimate as a PDF, to Send To or, when empty, to the billing email on the estimate. Each call sends another email. Get the id from List Estimates.',
		idempotent: false,
	},
	props: {
		estimateId: quickbooksAiProps.id({
			required: true,
			displayName: 'Estimate ID',
			description: 'QuickBooks estimate id. Use List Estimates to find it.',
		}),
		sendTo: quickbooksAiProps.sendTo({ required: false }),
	},
	async run(context) {
		return await quickbooksApi.sendEntity({
			auth: context.auth,
			entity: 'Estimate',
			id: context.propsValue.estimateId,
			sendTo: context.propsValue.sendTo,
		});
	},
});
