import { createAction, Property } from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { openaiAuth } from '../auth';
import { streamToBuffer } from '../common/common';

type Voice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
type ResponseFormat = 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm';

export const textToSpeech = createAction({
  audience: 'both',
	auth: openaiAuth,
	name: 'text_to_speech',
	classification: 'READ',
	displayName: 'Text-to-Speech',
	description: 'Turn text into a spoken audio file.',
	aiMetadata: { description: 'Synthesizes spoken audio from text using an OpenAI TTS model and one of six prebuilt voices (alloy, echo, fable, onyx, nova, shimmer), writing the result as an mp3, opus, aac, or flac file at a playback speed between 0.25 and 4. This is the text-to-audio direction of this piece; transcribe and translate go the other way, turning audio into text. Requires the text, a TTS-capable model, a voice, and an output format. Not idempotent: each call renders a new audio file.', idempotent: false },
	props: {
		text: Property.LongText({
			displayName: 'Text',
			description: 'What the voice should say.',
			required: true,
		}),
		model: Property.Dropdown({
			auth: openaiAuth,
			displayName: 'Model',
			required: true,
			description: 'The OpenAI model that speaks the text.',
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
		voice: Property.StaticDropdown({
			displayName: 'Voice',
			description: 'The voice that reads the text.',
			required: true,
			defaultValue: 'alloy',
			options: {
				disabled: false,
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
			displayName: 'Audio Format',
			required: true,
			description: 'The audio file type.',
			defaultValue: 'mp3',
			options: {
				disabled: false,
				options: [
					{ label: 'MP3', value: 'mp3' },
					{ label: 'Opus', value: 'opus' },
					{ label: 'AAC', value: 'aac' },
					{ label: 'FLAC', value: 'flac' },
				],
			},
		}),
		speed: Property.Number({
			displayName: 'Speed',
			description: 'From 0.25 to 4. 1 is normal speed.',
			defaultValue: 1.0,
			required: false,
			advanced: true,
		}),
		fileName: Property.ShortText({
			displayName: 'File Name',
			description: 'Name for the audio file, without the extension.',
			placeholder: 'e.g. welcome-message',
			required: false,
			defaultValue: 'audio',
			advanced: true,
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
