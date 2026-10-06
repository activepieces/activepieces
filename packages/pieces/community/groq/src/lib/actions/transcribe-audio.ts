import { createAction, Property } from '@activepieces/pieces-framework';
import { groqAuth } from '../..';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { transcribeAudioActionOutputSchema } from '../output-schemas';

export const transcribeAudio = createAction({
  audience: 'both',
	auth: groqAuth,
	name: 'transcribe-audio',
	classification: 'READ',
	displayName: 'Transcribe Audio',
	description: 'Turn speech in an audio file into text, in the language spoken.',
	aiMetadata: { description: 'Runs Groq speech-to-text (Whisper) over an uploaded audio file and returns the spoken content transcribed in its original language; a response-format prop switches between plain text, JSON, and verbose JSON with segment timings. Choose this over the sibling Translate Audio action whenever the transcript must stay in the language that was spoken, since Translate Audio always renders English. Requires an audio file (flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, webm) and a Whisper model, with an optional ISO-639-1 language hint that improves accuracy; not idempotent: each call re-runs the model and may return slightly different text.', idempotent: false },
	props: {
		file: Property.File({
			displayName: 'Audio File',
			required: true,
			description:
				'flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav or webm.',
		}),
		model: Property.Dropdown({
			displayName: 'Model',
			auth: groqAuth,
			required: true,
			description: 'whisper-large-v3 is the most accurate; turbo is faster.',
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
							token: auth.secret_text,
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
		language: Property.ShortText({
			displayName: 'Language',
			required: false,
			advanced: true,
			placeholder: 'en',
			description:
				'ISO-639-1 code of the spoken language, for better accuracy.',
		}),
		prompt: Property.LongText({
			displayName: 'Prompt',
			required: false,
			advanced: true,
			description:
				"Spellings or text that came just before, in the audio's language.",
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
	outputSchema: transcribeAudioActionOutputSchema,
	async run({ auth, propsValue }) {
		const { file, model, language, prompt, temperature, responseFormat } = propsValue;

		// Create form data
		const formData = new FormData();
		formData.append('file', new Blob([file.data] as unknown as BlobPart[]), file.filename);
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
				token: auth.secret_text,
			},
			headers: {
				'Content-Type': 'multipart/form-data',
			},
			body: formData,
		});

		return response.body;
	},
});
