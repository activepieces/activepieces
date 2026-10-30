import { createAction } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { deletedOutputSchema } from '../../output-schemas';

export const deleteTimeEntryAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_delete_time_entry',
	outputSchema: deletedOutputSchema,
	displayName: 'Delete Time Entry',
	description: 'Deletes a time entry.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes one time entry. Locked (approved) entries cannot be deleted.',
		idempotent: false,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		timeEntryId: clockifyAiProps.timeEntryId({ required: true }),
	},
	async run({ auth, propsValue }) {
		await clockifyApi.deleteTimeEntry({
			auth,
			workspaceId: propsValue.workspaceId,
			timeEntryId: propsValue.timeEntryId,
		});
		return { deleted: true, id: propsValue.timeEntryId };
	},
});
