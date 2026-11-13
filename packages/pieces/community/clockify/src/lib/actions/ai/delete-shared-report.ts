import { createAction } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { deletedOutputSchema } from '../../output-schemas';

export const deleteSharedReportAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_delete_shared_report',
	outputSchema: deletedOutputSchema,
	displayName: 'Delete Shared Report',
	description: 'Deletes a shared report.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a shared report; its link stops working. The time data it showed is untouched.',
		idempotent: false,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		sharedReportId: clockifyAiProps.sharedReportId({ required: true }),
	},
	async run({ auth, propsValue }) {
		await clockifyApi.deleteSharedReport({
			auth,
			workspaceId: propsValue.workspaceId,
			sharedReportId: propsValue.sharedReportId,
		});
		return { deleted: true, id: propsValue.sharedReportId };
	},
});
