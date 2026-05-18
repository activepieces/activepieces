import { createAction, Property } from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { openaiAuth } from '../auth';
import { streamToBuffer } from '../common/common';

type Voice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
type Format = 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm';

export const textToSpeech = createAction({
	auth: openaiAuth,
	name: 'text_to_speech',
	displayName: 'Text to Speech',
	description: 'Convert text to audio using OpenAI.',
	props: {
		baseUrl: Property.ShortText({
			displayName: 'Base URL',
			description: 'The base URL for the OpenAI API. Default is https://api.openai.com/v1',
			required: false,
		}),
		model: Property.StaticDropdown({
			displayName: 'Model',
			description: 'The model to use for text to speech.',
			required: true,
			defaultValue: 'tts-1',
			options: {
				options: [
					{ label: 'tts-1', value: 'tts-1' },
					{ label: 'tts-1-hd', value: 'tts-1-hd' },
				],
			},
		}),
		input: Property.LongText({
			displayName: 'Input',
			description: 'The text to convert to audio.',
			required: true,
		}),
		voice: Property.StaticDropdown({
			displayName: 'Voice',
			description: 'The voice to use for audio generation.',
			required: true,
			defaultValue: 'alloy',
			options: {
				options: [
					{ label: 'Alloy', value: 'alloy' },
					{ label: 'Echo', value: 'echo' },
					{ label: 'Fable', value: 'fable' },
					{ label: 'Onyx', value: 'onyx' },
					{ label: 'Nova', value: 'nova' },
					{ label: 'Shimmer', value: 'shimmer' },
				],
			},
		}),
		format: Property.StaticDropdown({
			displayName: 'Format',
			description: 'The format of the generated audio.',
			required: false,
			defaultValue: 'mp3',
			options: {
				options: [
					{ label: 'MP3', value: 'mp3' },
					{ label: 'Opus', value: 'opus' },
					{ label: 'AAC', value: 'aac' },
					{ label: 'FLAC', value: 'flac' },
					{ label: 'WAV', value: 'wav' },
					{ label: 'PCM', value: 'pcm' },
				],
			},
		}),
		speed: Property.Number({
			displayName: 'Speed',
			description: 'The speed of the generated audio. Must be between 0.25 and 4.0.',
			required: false,
			defaultValue: 1.0,
		}),
		fileName: Property.ShortText({
			displayName: 'File Name',
			description: 'The name of the generated audio file.',
			required: false,
		}),
	},
	async run({ auth, propsValue, files }) {
		const { model, input, voice, format, speed, fileName, baseUrl } = propsValue;
		const openai = new OpenAI({
			apiKey: auth as string,
			baseURL: baseUrl || undefined,
		});

		const audio = await openai.audio.speech.create({
			model: model,
			input: input,
			voice: voice as Voice,
			speed: speed,
			response_format: format as Format,
		});
		const result = await streamToBuffer(audio.body);

		return files.write({
			fileName: `${fileName || 'audio'}.${format}`,
			data: result as Buffer,
		});
	},
});
