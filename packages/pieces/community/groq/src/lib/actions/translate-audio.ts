import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { groqAuth } from '../auth';
import { groqClient } from '../common/client';
import { groqProps } from '../common/props';
import { translateAudioActionOutputSchema } from '../output-schemas';

export const translateAudioAction = createAction({
  audience: 'human',
	auth: groqAuth,
	name: 'translate-audio',
	classification: 'READ',
	displayName: 'Translate Audio',
	description: 'Turn speech in any supported language into English text.',
	aiMetadata: { description: 'Runs Groq speech-to-text (Whisper) over an uploaded audio file and returns the spoken content as English text, translating from whatever language was spoken; a response-format prop switches between plain text, JSON, and verbose JSON with segment timings. Pick this only when English output is wanted - the target language cannot be changed, and the sibling Transcribe Audio action keeps the transcript in the original spoken language. Requires an audio file (flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, webm) and a Whisper model; not idempotent: each call re-runs the model and may return slightly different text.', idempotent: false },
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
		model: groqProps.whisperModel({ required: true, description: 'Use whisper-large-v3; the turbo model cannot translate.' }),
		prompt: Property.LongText({
			displayName: 'Prompt',
			required: false,
			advanced: true,
			description:
				'Spellings or earlier text in English to guide the translation.',
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

		const formData = new FormData();
		formData.append('file', new Blob([new Uint8Array(file.data)]), file.filename);
		formData.append('model', model);

		if (prompt) formData.append('prompt', prompt);
		if (temperature !== undefined) formData.append('temperature', temperature.toString());
		if (responseFormat) formData.append('response_format', responseFormat);

		return await groqClient.request({
			auth,
			method: HttpMethod.POST,
			path: '/audio/translations',
			headers: {
				'Content-Type': 'multipart/form-data',
			},
			body: formData,
		});
	},
});
