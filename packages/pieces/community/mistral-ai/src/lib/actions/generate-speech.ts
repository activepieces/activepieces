import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { generateSpeechOutputSchema } from '../output-schemas';

export const generateSpeech = createAction({
	auth: mistralAuth,
	name: 'generate_speech',
	classification: 'READ',
	displayName: 'Generate Speech',
	description: 'Turn text into a spoken audio file.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Converts text into spoken audio with Mistral text-to-speech and returns it as a file in the chosen format (mp3 by default). A voice is required: a preset slug (default en_paul_neutral) or a custom voice UUID. Use Transcribe Audio for the reverse direction. Not idempotent: each call bills a new generation and produces a new file.',
		idempotent: false,
	},
	outputSchema: generateSpeechOutputSchema,
	props: {
		input: Property.LongText({
			displayName: 'Text',
			description: 'The text to speak.',
			required: true,
		}),
		model: Property.ShortText({
			displayName: 'Model',
			description: 'Text-to-speech model id.',
			required: true,
			defaultValue: 'voxtral-mini-tts-latest',
		}),
		voice_id: Property.ShortText({
			displayName: 'Voice',
			description: 'A preset voice slug such as en_paul_neutral, en_paul_happy or en_paul_sad, or the UUID of a custom voice.',
			required: true,
			defaultValue: 'en_paul_neutral',
		}),
		response_format: Property.StaticDropdown({
			displayName: 'Audio Format',
			required: false,
			defaultValue: 'mp3',
			options: {
				options: [
					{ label: 'MP3', value: 'mp3' },
					{ label: 'WAV', value: 'wav' },
					{ label: 'FLAC', value: 'flac' },
					{ label: 'Opus', value: 'opus' },
					{ label: 'PCM', value: 'pcm' },
				],
			},
		}),
		file_name: Property.ShortText({
			displayName: 'File Name',
			description: 'Name for the audio file, without extension.',
			required: false,
			defaultValue: 'speech',
		}),
	},
	async run(context) {
		const { input, model, voice_id, response_format, file_name } = context.propsValue;
		const format = response_format ?? 'mp3';
		const response = await mistralApi.call<{ audio_data: string }>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: '/audio/speech',
			body: mistralApi.compact({ input, model, voice_id, response_format: format, stream: false }),
			timeout: 300000,
		});
		const data = Buffer.from(response.audio_data, 'base64');
		const fileName = `${file_name || 'speech'}.${format}`;
		const file = await context.files.write({ fileName, data });
		return {
			file,
			file_name: fileName,
			format,
			size_bytes: data.byteLength,
		};
	},
});
