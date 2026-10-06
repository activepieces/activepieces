import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioGetCallRecordingOutputSchema } from '../../output-schemas';

export const attioGetCallRecordingAction = createAction({
	auth: attioAuth,
	name: 'attio_get_call_recording',
	outputSchema: attioGetCallRecordingOutputSchema,
	displayName: 'Get Call Recording',
	description: 'Gets a call recording with its transcript.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets one call recording, including its transcript when processing has finished (status `completed`).',
		idempotent: true,
	},
	props: {
		meeting_id: Property.ShortText({ displayName: 'Meeting ID', description: 'From List Meetings or Create Meeting.', required: true }),
		call_recording_id: Property.ShortText({ displayName: 'Call Recording ID', description: 'From List Call Recordings.', required: true }),
	},
	async run(context) {
		const { meeting_id, call_recording_id } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/meetings/${meeting_id}/call_recordings/${call_recording_id}`,
		});
		return response.data;
	},
});
