import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioCreateCallRecordingOutputSchema } from '../../output-schemas';

export const attioCreateCallRecordingAction = createAction({
	auth: attioAuth,
	name: 'attio_create_call_recording',
	outputSchema: attioCreateCallRecordingOutputSchema,
	displayName: 'Create Call Recording',
	description: 'Attaches a call recording and transcript to a meeting.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Attaches a call recording to a meeting from a video URL and/or transcript segments. Always include a transcript. Rate limited to 1 request per second. Not idempotent.',
		idempotent: false,
	},
	props: {
		meeting_id: Property.ShortText({ displayName: 'Meeting ID', description: 'From List Meetings or Create Meeting.', required: true }),
		video_url: Property.ShortText({ displayName: 'Video URL', description: 'Publicly reachable URL of the recording.', required: false }),
		transcript: Property.Array({
			displayName: 'Transcript',
			description: 'Transcript segments in order.',
			required: true,
			properties: {
				speech: Property.LongText({ displayName: 'Speech', required: true }),
				start_time: Property.Number({ displayName: 'Start Time', description: 'Seconds from the start.', required: true }),
				end_time: Property.Number({ displayName: 'End Time', description: 'Seconds from the start.', required: true }),
				speaker_name: Property.ShortText({ displayName: 'Speaker Name', required: true }),
				speaker_email: Property.ShortText({ displayName: 'Speaker Email', required: false }),
			},
		}),
	},
	async run(context) {
		const { meeting_id, video_url, transcript } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: `/meetings/${meeting_id}/call_recordings`,
			body: {
				data: attioAi.compact({
					video_url,
					transcript: attioAi.records(transcript).map((segment) => ({
						speech: segment['speech'],
						start_time: segment['start_time'],
						end_time: segment['end_time'],
						speaker: attioAi.compact({ name: segment['speaker_name'], email_address: segment['speaker_email'] }),
					})),
				}),
			},
		});
		return response.data;
	},
});
