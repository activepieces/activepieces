import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioDeleteMeetingOutputSchema } from '../../output-schemas';

export const attioDeleteMeetingAction = createAction({
	auth: attioAuth,
	name: 'attio_delete_meeting',
	outputSchema: attioDeleteMeetingOutputSchema,
	displayName: 'Delete Meeting',
	description: 'Permanently deletes a meeting created through the API.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes a meeting and its recordings. Meetings from calendar sync cannot be deleted this way. Cannot be undone.',
		idempotent: false,
	},
	props: {
		meeting_id: Property.ShortText({ displayName: 'Meeting ID', description: 'From List Meetings or Create Meeting.', required: true }),
	},
	async run(context) {
		const { meeting_id } = context.propsValue;
		await attioApiCall({
			accessToken: context.auth.secret_text,
			method: HttpMethod.DELETE,
			resourceUri: `/meetings/${meeting_id}`,
		});
		return { success: true, meeting_id };
	},
});
