import { createAction, Property } from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { openaiAuth } from '../auth';
import { streamToBuffer } from '../common/common';

type Voice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
type ResponseFormat = 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm';

export const textToSpeech = createAction({
  audience: 'human',
	auth: openaiAuth,
	name: 'text_to_speech',
	displayName: 'Text-to-Speech',
	description: 'Generate an audio recording from text',
	props: {
		text: Property.LongText({
			displayName: 'Text',
			description: 'The text you want to hear.',
			required: true,
		}),
		model: Property.Dropdown({
			auth: openaiAuth,
			displayName: 'Model',
			required: true,
			description: 'The model which will generate the audio.',
			defaultValue: 'tts-1',
			refreshers: [],
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						placeholder: 'Enter your API key first',
						options: [],
					};
				}
				try {
					const openai = new OpenAI({ apiKey: auth.secret_text });
					const response = await openai.models.list();
					const ttsModels = response.data
						.filter((m) => m.id.startsWith('tts-') || /^gpt-.*-tts$/.test(m.id))
						.sort((a, b) => b.created - a.created);
					if (ttsModels.length === 0) {
						return {
							disabled: true,
							options: [],
							placeholder: 'No text-to-speech models available for this API key.',
						};
					}
					return {
						disabled: false,
						options: ttsModels.map((m) => ({ label: m.id, value: m.id })),
					};
				} catch {
					return {
						disabled: true,
						options: [],
						placeholder: "Couldn't load models. Check your API key or try again.",
					};
				}
			},
		}),
		speed: Property.Number({
			displayName: 'Speed',
			description: 'The speed of the audio. Minimum is 0.25 and maximum is 4.00.',
			defaultValue: 1.0,
			required: false,
		}),
		voice: Property.StaticDropdown({
			displayName: 'Voice',
			description: 'The voice to generate the audio in.',
			required: true,
			defaultValue: 'alloy',
			options: {
				disabled: false,
				options: [
					{ label: 'alloy', value: 'alloy' },
					{ label: 'echo', value: 'echo' },
					{ label: 'fable', value: 'fable' },
					{ label: 'onyx', value: 'onyx' },
					{ label: 'nova', value: 'nova' },
					{ label: 'shimmer', value: 'shimmer' },
				],
			},
		}),
		format: Property.StaticDropdown({
			displayName: 'Output Format',
			required: true,
			description: 'The format you want the audio file in.',
			defaultValue: 'mp3',
			options: {
				disabled: false,
				options: [
					{ label: 'mp3', value: 'mp3' },
					{ label: 'opus', value: 'opus' },
					{ label: 'aac', value: 'aac' },
					{ label: 'flac', value: 'flac' },
				],
			},
		}),
		fileName: Property.ShortText({
			displayName: 'File Name',
			description: 'The name of the output audio file (without extension).',
			required: false,
			defaultValue: 'audio',
		}),
	},
	async run({ auth, propsValue, files }) {
		const openai = new OpenAI({
			apiKey: auth.secret_text,
		});

		const { voice, format, model, text, speed, fileName } = propsValue;
		
		const audio = await openai.audio.speech.create({
			model: model,
			input: text,
			response_format: format as ResponseFormat,
			voice: voice as Voice,
			speed: speed,
		});
		const result = await streamToBuffer(audio.body);

		return files.write({
			fileName: `${fileName || 'audio'}.${format}`,
			data: result as Buffer,
		});
	},
});
