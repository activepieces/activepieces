import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { firefliesAiAuth } from '../../index';

export const uploadAudioAction = createAction({
	auth: firefliesAiAuth,
	name: 'upload_audio',
	displayName: 'Upload Audio',
	description: 'Upload an audio file to Fireflies for transcription (requires a publicly accessible URL)',
	props: {
		audioUrl: Property.ShortText({
			displayName: 'Audio URL',
			description: 'The publicly accessible URL to your audio file (mp3, mp4, wav, m4a, ogg). Fireflies API only accepts URLs, not direct file uploads. For private files, consider using signed URLs with short expiry times.',
			required: true,
		}),
	},
	async run({ propsValue, auth }) {
		// GraphQL mutation for uploading audio
		const query = `
			mutation uploadAudio($input: AudioUploadInput) {
				uploadAudio(input: $input) {
					success
					title
					message
				}
			}
		`;

		// Define interface for the input
		interface AudioUploadInput {
			url: string;
		}

		// Create input for the mutation with proper typing
		const input: AudioUploadInput = {
			url: propsValue.audioUrl,
		};

		// Make the GraphQL request
		const response = await makeRequest(
			auth as string,
			HttpMethod.POST,
			query,
			{ input },
		);

		return response;
	},
});
