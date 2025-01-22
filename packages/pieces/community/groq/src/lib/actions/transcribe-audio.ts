import { createAction, Property } from '@activepieces/pieces-framework';
import { groqAuth } from '../..';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

export const transcribeAudio = createAction({
	auth: groqAuth,
	name: 'transcribe-audio',
	displayName: 'Transcribe Audio',
	description: 'Transcribes audio into text in the input language.',
	props: {
		file: Property.File({
			displayName: 'Audio File',
			required: true,
			description:
				'The audio file to transcribe. Supported formats: flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, webm.',
		}),
		model: Property.Dropdown({
			displayName: 'Model',
			required: true,
			description: 'The model to use for transcription.',
			refreshers: [],
			defaultValue: 'whisper-large-v3',
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
							token: auth as string,
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
						placeholder: "Couldn't load models, API key is invalid",
					};
				}
			},
		}),
		language: Property.ShortText({
			displayName: 'Language',
			required: false,
			description:
				'The language of the input audio in ISO-639-1 format (e.g., "en" for English). This will improve accuracy and latency.',
		}),
		prompt: Property.LongText({
			displayName: 'Prompt',
			required: false,
			description:
				"An optional text to guide the model's style or continue a previous audio segment. The prompt should match the audio language.",
		}),
		temperature: Property.Number({
			displayName: 'Temperature',
			required: false,
			description:
				'The sampling temperature, between 0 and 1. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.',
			defaultValue: 0,
		}),
		responseFormat: Property.StaticDropdown({
			displayName: 'Response Format',
			required: false,
			description: 'The format of the transcript output.',
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
	async run({ auth, propsValue }) {
		const { file, model, language, prompt, temperature, responseFormat } = propsValue;

		// Create form data
		const formData = new FormData();
		formData.append('file', new Blob([file.data]), file.filename);
		formData.append('model', model);

		if (language) formData.append('language', language);
		if (prompt) formData.append('prompt', prompt);
		if (temperature !== undefined) formData.append('temperature', temperature.toString());
		if (responseFormat) formData.append('response_format', responseFormat);

		// Send request
		const response = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: 'https://api.groq.com/openai/v1/audio/transcriptions',
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: auth,
			},
			headers: {
				'Content-Type': 'multipart/form-data',
			},
			body: formData,
		});

		return response.body;
	},
});
