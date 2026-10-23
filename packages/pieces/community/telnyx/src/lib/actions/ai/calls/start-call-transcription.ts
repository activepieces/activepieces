import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxStartCallTranscriptionAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_start_call_transcription',
	displayName: 'Start Call Transcription',
	description: 'Starts real-time transcription of an active call.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Starts live speech-to-text on an answered call. Transcripts are delivered as call.transcription webhooks while the call runs; this does not create a stored transcription (use Start Call Recording with Transcribe for that). Stop with Stop Call Transcription. Billed per minute.',
		idempotent: false,
	},
	props: {
		callControlId: telnyxAiProps.callControlId({ required: true }),
		transcriptionEngine: Property.ShortText({
			displayName: 'Engine',
			description:
				'Transcription engine, e.g. "Google", "Telnyx", "Deepgram" or "Azure". Defaults to Google.',
			required: false,
		}),
		transcriptionTracks: Property.StaticDropdown({
			displayName: 'Tracks',
			description: 'Which audio to transcribe. Defaults to inbound.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'inbound', value: 'inbound' },
					{ label: 'outbound', value: 'outbound' },
					{ label: 'both', value: 'both' },
				],
			},
		}),
		transcriptionEngineConfig: Property.Json({
			displayName: 'Engine Config',
			description:
				'Optional engine settings as JSON, e.g. {"language": "en", "interim_results": true}.',
			required: false,
		}),
		clientState: telnyxAiProps.clientState({ required: false }),
		commandId: telnyxAiProps.commandId({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.sendCallCommand({
			auth: context.auth,
			callControlId: p.callControlId,
			command: 'transcription_start',
			body: telnyxUtils.compact({
				values: {
					transcription_engine: p.transcriptionEngine,
					transcription_tracks: p.transcriptionTracks,
					transcription_engine_config: p.transcriptionEngineConfig,
					client_state: p.clientState,
					command_id: p.commandId,
				},
			}),
		});
	},
});
