import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { groqAuth } from '../auth';
import { groqClient } from '../common/client';
import { groqProps } from '../common/props';
import { transcribeAudioActionOutputSchema } from '../output-schemas';

export const transcribeAudioAction = createAction({
  audience: 'human',
	auth: groqAuth,
	name: 'transcribe-audio',
	classification: 'READ',
	displayName: 'Transcribe Audio',
	description: 'Turn speech in an audio file into text, in the language spoken.',
	aiMetadata: { description: 'Runs Groq speech-to-text (Whisper) over an uploaded audio file and returns the spoken content transcribed in its original language; a response-format prop switches between plain text, JSON, and verbose JSON with segment timings. Choose this over the sibling Translate Audio action whenever the transcript must stay in the language that was spoken, since Translate Audio always renders English. Requires an audio file (flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, webm) and a Whisper model, with an optional ISO-639-1 language hint that improves accuracy; not idempotent: each call re-runs the model and may return slightly different text.', idempotent: false },
	propertyGroups: [
		{ key: 'recording', display: 'section', label: 'Recording', icon: 'paperclip', props: ['file'] },
		{ key: 'settings', display: 'section', label: 'Settings', icon: 'sliders', props: ['model'] },
		{ key: 'output', display: 'section', label: 'Output', icon: 'file', props: ['responseFormat'] },
	],
	props: {
		file: Property.File({
			displayName: 'Audio File',
			required: true,
			description:
				'flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav or webm.',
		}),
		model: groqProps.whisperModel({ required: true }),
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

		const formData = new FormData();
		formData.append('file', new Blob([new Uint8Array(file.data)]), file.filename);
		formData.append('model', model);

		if (language) formData.append('language', language);
		if (prompt) formData.append('prompt', prompt);
		if (temperature !== undefined) formData.append('temperature', temperature.toString());
		if (responseFormat) formData.append('response_format', responseFormat);

		return await groqClient.request({
			auth,
			method: HttpMethod.POST,
			path: '/audio/transcriptions',
			headers: {
				'Content-Type': 'multipart/form-data',
			},
			body: formData,
		});
	},
});
