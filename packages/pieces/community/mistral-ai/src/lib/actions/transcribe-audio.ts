import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { transcribeAudioOutputSchema } from '../output-schemas';

export const transcribeAudio = createAction({
	auth: mistralAuth,
	name: 'transcribe_audio',
	classification: 'READ',
	displayName: 'Transcribe Audio',
	description: 'Convert speech in an audio file to text with a Voxtral model.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Transcribes speech to text with a Mistral Voxtral model and returns the full text, detected language and optional timestamped segments. Provide exactly one source: an audio file, a public audio URL, or the id of a file already uploaded to Mistral. Setting the language improves accuracy; diarization labels speakers. Read-only, stores nothing; safe to retry.',
		idempotent: true,
	},
	outputSchema: transcribeAudioOutputSchema,
	props: {
		model: Property.StaticDropdown({
			displayName: 'Model',
			required: true,
			defaultValue: 'voxtral-mini-latest',
			options: {
				options: [
					{ label: 'voxtral-mini-latest', value: 'voxtral-mini-latest' },
					{ label: 'voxtral-mini-2507', value: 'voxtral-mini-2507' },
				],
			},
		}),
		file: Property.File({
			displayName: 'Audio File',
			description: 'The audio file to transcribe. Leave empty if you use Audio URL or File ID.',
			required: false,
		}),
		file_url: Property.ShortText({
			displayName: 'Audio URL',
			description: 'Public URL of the audio file.',
			required: false,
		}),
		file_id: Property.ShortText({
			displayName: 'File ID',
			description: 'UUID of an audio file already uploaded to Mistral (see List Files).',
			required: false,
		}),
		language: Property.ShortText({
			displayName: 'Language',
			description: 'Two-letter language code of the audio, e.g. en or fr. Leave empty to auto-detect.',
			required: false,
		}),
		diarize: Property.Checkbox({
			displayName: 'Identify Speakers',
			description: 'Label which speaker said each segment.',
			required: false,
			defaultValue: false,
		}),
		timestamp_granularity: Property.StaticDropdown({
			displayName: 'Timestamps',
			required: false,
			options: {
				options: [
					{ label: 'Segment', value: 'segment' },
					{ label: 'Word', value: 'word' },
				],
			},
		}),
	},
	async run(context) {
		const { model, file, file_url, file_id, language, diarize, timestamp_granularity } = context.propsValue;
		const sources = [file, file_url, file_id].filter((source) => source !== undefined && source !== null && source !== '');
		if (sources.length !== 1) {
			throw new Error('Provide exactly one of Audio File, Audio URL or File ID.');
		}
		const form = new FormData();
		form.append('model', model);
		if (file) {
			form.append('file', Buffer.from(file.data), file.filename);
		}
		if (file_url) {
			form.append('file_url', file_url);
		}
		if (file_id) {
			form.append('file_id', file_id);
		}
		if (language) {
			form.append('language', language);
		}
		if (diarize) {
			form.append('diarize', 'true');
		}
		if (timestamp_granularity) {
			form.append('timestamp_granularities', timestamp_granularity);
		}
		const response = await mistralApi.call<TranscriptionResponse>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: '/audio/transcriptions',
			headers: form.getHeaders(),
			body: form,
			timeout: 600000,
		});
		return {
			model: response.model,
			text: response.text,
			language: response.language ?? null,
			segments: (response.segments ?? []).map((segment) => ({
				text: segment.text,
				start: segment.start,
				end: segment.end,
				speaker_id: segment.speaker_id ?? null,
			})),
			prompt_audio_seconds: response.usage?.prompt_audio_seconds ?? null,
			total_tokens: response.usage?.total_tokens ?? null,
		};
	},
});

type TranscriptionResponse = {
	model: string;
	text: string;
	language: string | null;
	segments?: { text: string; start: number; end: number; speaker_id?: string | null }[];
	usage?: { prompt_audio_seconds?: number | null; total_tokens?: number };
};
