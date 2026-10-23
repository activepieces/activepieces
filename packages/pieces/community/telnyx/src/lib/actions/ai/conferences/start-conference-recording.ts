import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxStartConferenceRecordingAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_start_conference_recording',
	displayName: 'Start Conference Recording',
	description: 'Starts recording a conference.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Starts recording the conference audio. When stopped (Stop Conference Recording) or ended, the recording appears in List Recordings. Not idempotent.',
		idempotent: false,
	},
	props: {
		conferenceId: Property.ShortText({
			displayName: 'Conference ID',
			description: 'Conference ID, returned by Create Conference or List Conferences.',
			required: true,
		}),
		format: Property.StaticDropdown({
			displayName: 'Format',
			description: 'Audio file format.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'MP3', value: 'mp3' },
					{ label: 'WAV', value: 'wav' },
				],
			},
		}),
		channels: Property.StaticDropdown({
			displayName: 'Channels',
			description: 'single (mixed) or dual (separate channels). Defaults to single.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Single', value: 'single' },
					{ label: 'Dual', value: 'dual' },
				],
			},
		}),
		playBeep: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Play Beep',
			description: 'Whether to play a beep when recording starts.',
		}),
		trim: Property.StaticDropdown({
			displayName: 'Trim',
			description: 'Set to trim silence from the start and end of the recording.',
			required: false,
			options: {
				disabled: false,
				options: [{ label: 'Trim Silence', value: 'trim-silence' }],
			},
		}),
		customFileName: Property.ShortText({
			displayName: 'Custom File Name',
			description: 'Custom name for the recording file.',
			required: false,
		}),
		commandId: telnyxAiProps.commandId({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.runConferenceCommand({
			auth: context.auth,
			conferenceId: p.conferenceId,
			command: 'record_start',
			body: telnyxUtils.compact({
				values: {
					format: p.format,
					channels: p.channels,
					play_beep: p.playBeep,
					trim: p.trim,
					custom_file_name: p.customFileName,
					command_id: p.commandId,
				},
			}),
		});
	},
});
