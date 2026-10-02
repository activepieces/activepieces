import { createAction, Property } from '@activepieces/pieces-framework';
import { groqAuth } from '../..';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { translateAudioActionOutputSchema } from '../output-schemas';

export const translateAudio = createAction({
  audience: 'both',
	auth: groqAuth,
	name: 'translate-audio',
	classification: 'READ',
	displayName: 'Translate Audio',
	description: 'Turn speech in any supported language into English text.',
	aiMetadata: { description: 'Runs Groq speech-to-text (Whisper) over an uploaded audio file and returns the spoken content as English text, translating from whatever language was spoken; a response-format prop switches between plain text, JSON, and verbose JSON with segment timings. Pick this only when English output is wanted - the target language cannot be changed, and the sibling Transcribe Audio action keeps the transcript in the original spoken language. Requires an audio file (flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, webm) and a Whisper model; not idempotent: each call re-runs the model and may return slightly different text.', idempotent: false },
	props: {
		file: Property.File({
			displayName: 'Audio File',
			required: true,
			description:
				'flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav or webm.',
		}),
		model: Property.Dropdown({
			displayName: 'Model',
			required: true,
			description: 'Use whisper-large-v3; the turbo model cannot translate.',
			refreshers: [],
			defaultValue: 'whisper-large-v3',
			auth: groqAuth,
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						placeholder: 'Please connect your Groq account first.',
						options: [],
					};
				}
				try {
					const response = await httpClient.sendRequest({
						url: 'https://api.groq.com/openai/v1/models',
						method: HttpMethod.GET,
						authentication: {
							type: AuthenticationType.BEARER_TOKEN,
							token: auth.secret_text
						},
					});
					// Filter for whisper models only
					const models = (response.body.data as Array<{ id: string }>).filter((model) =>
						model.id.toLowerCase().includes('whisper'),
					);
					return {
						disabled: false,
						options: models.map((model) => {
							return {
								label: model.id,
								value: model.id,
							};
						}),
					};
				} catch (error) {
					return {
						disabled: true,
						options: [],
						placeholder: "Couldn't load models. Check your API key or try again.",
					};
				}
			},
		}),
		prompt: Property.LongText({
			displayName: 'Prompt',
			required: false,
			advanced: true,
			description:
				'Spellings or earlier text to guide the translation.',
		}),
		temperature: Property.Number({
			displayName: 'Temperature',
			required: false,
			advanced: true,
			description:
				'From 0 to 1. Groq recommends 0.',
			defaultValue: 0,
		}),
		responseFormat: Property.StaticDropdown({
			displayName: 'Response Format',
			required: false,
			description: 'Text returns the words alone; Verbose JSON adds segment timings.',
			defaultValue: 'json',
			options: {
				disabled: false,
				options: [
					{ label: 'JSON', value: 'json' },
					{ label: 'Text', value: 'text' },
					{ label: 'Verbose JSON', value: 'verbose_json' },
				],
			},
		}),
	},
	outputSchema: translateAudioActionOutputSchema,
	async run({ auth, propsValue }) {
		const { file, model, prompt, temperature, responseFormat } = propsValue;

		// Create form data
		const formData = new FormData();
		formData.append('file', new Blob([file.data] as unknown as BlobPart[]), file.filename);
		formData.append('model', model);

		if (prompt) formData.append('prompt', prompt);
		if (temperature !== undefined) formData.append('temperature', temperature.toString());
		if (responseFormat) formData.append('response_format', responseFormat);

		// Send request
		const response = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: 'https://api.groq.com/openai/v1/audio/translations',
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: auth.secret_text
			},
			headers: {
				'Content-Type': 'multipart/form-data',
			},
			body: formData,
		});

		return response.body;
	},
});
