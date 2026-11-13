import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxDeleteTimeActivityOutputSchema } from '../../../output-schemas';

export const deleteTimeActivityAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_delete_time_activity',
	outputSchema: quickbooksSandboxDeleteTimeActivityOutputSchema,
	displayName: 'Delete Time Activity',
	description: 'Permanently deletes a time activity.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes one time activity; it cannot be restored. Reads the latest SyncToken first. Get the id from List Time Activities.',
		idempotent: false,
	},
	props: {
		timeActivityId: quickbooksAiProps.id({
			required: true,
			displayName: 'Time Activity ID',
			description: 'QuickBooks time activity id. Use List Time Activities to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.deleteEntity({
			auth: context.auth,
			entity: 'TimeActivity',
			id: context.propsValue.timeActivityId,
		});
	},
});
