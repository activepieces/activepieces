import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firefliesAiAuth } from '../auth';
import { BASE_URL } from '../common';

export const uploadAudioAction = createAction({
	auth: firefliesAiAuth,
	name: 'upload_audio',
	classification: 'WRITE',
	displayName: 'Upload Audio',
	description: "Sends a recording's public link to Fireflies to transcribe.",
	audience: 'both',
	aiMetadata: { description: 'Submits a publicly accessible audio/video URL (mp3, mp4, wav, m4a, ogg) to Fireflies to create a new meeting and transcribe it. Use when the agent has a recording it wants transcribed and analyzed. The API accepts only URLs, not direct file uploads. Not idempotent: each call queues a new transcription job.', idempotent: false },
	props: {
		publicLinkNote: Property.MarkDown({
			value: 'Fireflies downloads the file later, so the link must be public. For a private file, use a signed link that stays valid for a few hours.',
			variant: MarkdownVariant.WARNING,
		}),
		audioUrl: Property.ShortText({
			displayName: 'Recording URL',
			description: 'Public link to an mp3, mp4, wav, m4a or ogg file.',
			placeholder: 'https://example.com/meeting.mp3',
			required: true,
		}),
		title: Property.ShortText({
			displayName: 'Meeting Title',
			description: 'Name of the new meeting in Fireflies.',
			placeholder: 'Weekly sync',
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
				token: auth.secret_text,
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
