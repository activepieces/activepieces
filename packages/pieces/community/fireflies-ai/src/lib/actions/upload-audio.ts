import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRestRequest } from '../common/client';
import { firefliesAiAuth } from '../../index';

export const uploadAudioAction = createAction({
	auth: firefliesAiAuth,
	name: 'upload_audio',
	displayName: 'Upload Audio',
	description: 'Upload an audio file to Fireflies for transcription',
	props: {
		title: Property.ShortText({
			displayName: 'Meeting Title',
			description: 'The title of the meeting',
			required: true,
		}),
		audioUrl: Property.ShortText({
			displayName: 'Audio URL',
			description: 'Public URL to the audio file that will be transcribed',
			required: true,
		}),
		participants: Property.Array({
			displayName: 'Participants',
			description: 'List of participant emails (optional)',
			required: false,
		}),
		date: Property.DateTime({
			displayName: 'Meeting Date',
			description: 'The date when the meeting occurred',
			required: false,
		}),
	},
	async run({ propsValue, auth }) {
		// Prepare request body
		const requestBody = {
			title: propsValue.title,
			audio_url: propsValue.audioUrl,
		};

		// Add optional parameters if provided
		if (propsValue.participants && propsValue.participants.length > 0) {
			requestBody['participants'] = propsValue.participants;
		}

		if (propsValue.date) {
			requestBody['date'] = propsValue.date;
		}

		const response = await makeRestRequest(
			auth as string,
			HttpMethod.POST,
			'/meetings/upload',
			requestBody,
		);

		return response;
	},
});
