import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioApiCall } from '../common/client';
import { attioAuth } from '../auth';
import { callRecordingIdDropdown, meetingIdDropdown } from '../common/props';

export const getCallTranscriptAction = createAction({
	auth: attioAuth,
	name: 'get_call_transcript',
	displayName: 'Get Call Transcript',
	description: 'Fetches the full transcript for a given call recording.',
	audience: 'both',
	aiMetadata: { description: 'Retrieves the full transcript for a specific call recording, identified by its meeting ID and call recording ID. Use this to obtain the spoken text of a recorded call, typically after a call-recording event. Read-only and idempotent.', idempotent: true },
	props: {
		meeting_id: meetingIdDropdown({
			displayName: 'Meeting',
			description: 'The meeting that contains the call recording.',
			required: true,
		}),
		call_recording_id: callRecordingIdDropdown({
			displayName: 'Call Recording',
			description: 'The call recording to fetch the transcript for.',
			required: true,
		}),
	},
	async run(context) {
		const { meeting_id, call_recording_id } = context.propsValue;

		const response = await attioApiCall<{ data: Record<string, unknown>; pagination: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/meetings/${meeting_id}/call_recordings/${call_recording_id}/transcript`,
		});

		return response;
	},
});
