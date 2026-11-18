import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioDeleteCallRecordingOutputSchema } from '../../output-schemas';

export const attioDeleteCallRecordingAction = createAction({
	auth: attioAuth,
	name: 'attio_delete_call_recording',
	outputSchema: attioDeleteCallRecordingOutputSchema,
	displayName: 'Delete Call Recording',
	description: 'Permanently deletes a call recording.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes a call recording and its transcript. Cannot be undone.',
		idempotent: false,
	},
	props: {
		meeting_id: Property.ShortText({ displayName: 'Meeting ID', description: 'From List Meetings or Create Meeting.', required: true }),
		call_recording_id: Property.ShortText({ displayName: 'Call Recording ID', description: 'From List Call Recordings.', required: true }),
	},
	async run(context) {
		const { meeting_id, call_recording_id } = context.propsValue;
		await attioApiCall({
			accessToken: context.auth.secret_text,
			method: HttpMethod.DELETE,
			resourceUri: `/meetings/${meeting_id}/call_recordings/${call_recording_id}`,
		});
		return { success: true, call_recording_id };
	},
});
