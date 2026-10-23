import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxStartCallRecordingAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_start_call_recording',
	displayName: 'Start Call Recording',
	description: 'Starts recording an active call.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Starts recording an answered call. The recording appears in List Recordings after it stops (Stop Call Recording or hang-up). Set Transcribe to Yes to also get a stored transcription in List Recording Transcriptions. Recording is billed.',
		idempotent: false,
	},
	props: {
		callControlId: telnyxAiProps.callControlId({ required: true }),
		format: Property.StaticDropdown({
			displayName: 'Format',
			description: 'Recording file format.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'mp3', value: 'mp3' },
					{ label: 'wav', value: 'wav' },
				],
			},
		}),
		channels: Property.StaticDropdown({
			displayName: 'Channels',
			description: 'single mixes both legs; dual keeps each leg on its own channel.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'single', value: 'single' },
					{ label: 'dual', value: 'dual' },
				],
			},
		}),
		playBeep: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Play Beep',
			description: 'Whether to play a beep when recording starts. Defaults to No.',
		}),
		maxLength: Property.Number({
			displayName: 'Max Length (seconds)',
			description: 'Stop after this many seconds (0 = no limit, max 14400). Defaults to 0.',
			required: false,
		}),
		timeoutSecs: Property.Number({
			displayName: 'Silence Timeout (seconds)',
			description: 'Stop after this many seconds of silence (0 = never). Defaults to 0.',
			required: false,
		}),
		recordingTrack: Property.StaticDropdown({
			displayName: 'Track',
			description: 'Which audio to record. Defaults to both.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'both', value: 'both' },
					{ label: 'inbound', value: 'inbound' },
					{ label: 'outbound', value: 'outbound' },
				],
			},
		}),
		trimSilence: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Trim Silence',
			description: 'Whether to trim leading and trailing silence. Defaults to No.',
		}),
		customFileName: Property.ShortText({
			displayName: 'Custom File Name',
			description: 'Optional file name (without extension) for the recording.',
			required: false,
		}),
		transcription: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Transcribe',
			description: 'Whether to create a stored transcription of the recording. Defaults to No.',
		}),
		transcriptionEngine: Property.StaticDropdown({
			displayName: 'Transcription Engine',
			description: 'Engine for the stored transcription. Defaults to A.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'A', value: 'A' },
					{ label: 'B', value: 'B' },
					{ label: 'deepgram/nova-3', value: 'deepgram/nova-3' },
				],
			},
		}),
		transcriptionLanguage: Property.ShortText({
			displayName: 'Transcription Language',
			description: 'Language code for the transcription, e.g. "en-US". Defaults to en-US.',
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
			command: 'record_start',
			body: telnyxUtils.compact({
				values: {
					format: p.format,
					channels: p.channels,
					play_beep: p.playBeep,
					max_length: p.maxLength,
					timeout_secs: p.timeoutSecs,
					recording_track: p.recordingTrack,
					trim: p.trimSilence ? 'trim-silence' : undefined,
					custom_file_name: p.customFileName,
					transcription: p.transcription,
					transcription_engine: p.transcriptionEngine,
					transcription_language: p.transcriptionLanguage,
					client_state: p.clientState,
					command_id: p.commandId,
				},
			}),
		});
	},
});
