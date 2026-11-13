import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxCreateTimeActivityOutputSchema } from '../../../output-schemas';

export const getTimeActivityAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_time_activity',
	outputSchema: quickbooksSandboxCreateTimeActivityOutputSchema,
	displayName: 'Get Time Activity',
	description: 'Gets one time activity by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Reads one time activity with its worker, customer, hours, billable status and SyncToken. Get the id from List Time Activities or Create Time Activity.',
		idempotent: true,
	},
	props: {
		timeActivityId: quickbooksAiProps.id({
			required: true,
			displayName: 'Time Activity ID',
			description: 'QuickBooks time activity id. Use List Time Activities to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.getEntity({
			auth: context.auth,
			entity: 'TimeActivity',
			id: context.propsValue.timeActivityId,
		});
	},
});
