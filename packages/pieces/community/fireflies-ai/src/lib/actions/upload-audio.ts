import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firefliesAiAuth } from '../../index';
import { BASE_URL } from '../common';

export const uploadAudioAction = createAction({
	auth: firefliesAiAuth,
	name: 'upload_audio',
	displayName: 'Upload Audio',
	description:
		'Creates a new meeeting in Fireflies for transcription (requires a publicly accessible URL).',
	props: {
		audioUrl: Property.ShortText({
			displayName: 'Audio URL',
			description:
				'The publicly accessible URL to your audio file (mp3, mp4, wav, m4a, ogg). Fireflies API only accepts URLs, not direct file uploads. For private files, consider using signed URLs with short expiry times.',
			required: true,
		}),
		title: Property.ShortText({
			displayName: 'Title',
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
			title: string;
		}

		// Create input for the mutation with proper typing
		const input: AudioUploadInput = {
			url: propsValue.audioUrl,
			title: propsValue.title,
		};

		const response = await httpClient.sendRequest({
			url: BASE_URL,
			method: HttpMethod.POST,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: auth,
			},
			body: {
				query,
				variables: {
					input,
				},
			},
		});

		return response.body;
	},
});
