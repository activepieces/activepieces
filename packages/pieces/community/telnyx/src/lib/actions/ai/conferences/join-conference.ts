import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxJoinConferenceAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_join_conference',
	displayName: 'Join Conference',
	description: 'Adds an active call to a conference.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds an active, answered call (call_control_id from Dial Call) to an existing conference, optionally muted, on hold or as a supervisor. Not idempotent: joining twice fails or moves the call.',
		idempotent: false,
	},
	props: {
		conferenceId: Property.ShortText({
			displayName: 'Conference ID',
			description: 'Conference ID, returned by Create Conference or List Conferences.',
			required: true,
		}),
		callControlId: telnyxAiProps.callControlId({ required: true }),
		clientState: telnyxAiProps.clientState({ required: false }),
		commandId: telnyxAiProps.commandId({ required: false }),
		endConferenceOnExit: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'End Conference On Exit',
			description: 'Whether the conference ends for everyone when this participant leaves.',
		}),
		softEndConferenceOnExit: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Soft End Conference On Exit',
			description:
				'Whether the conference ends once this participant leaves, letting others finish their current audio.',
		}),
		hold: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Hold',
			description: 'Whether the participant joins on hold.',
		}),
		holdAudioUrl: Property.ShortText({
			displayName: 'Hold Audio URL',
			description: 'URL of audio played while the participant is on hold.',
			required: false,
		}),
		holdMediaName: Property.ShortText({
			displayName: 'Hold Media Name',
			description: 'Name of uploaded media played while the participant is on hold.',
			required: false,
		}),
		mute: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Mute',
			description: 'Whether the participant joins muted.',
		}),
		startConferenceOnEnter: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Start Conference On Enter',
			description: 'Whether the conference starts when this participant joins.',
		}),
		supervisorRole: Property.StaticDropdown({
			displayName: 'Supervisor Role',
			description:
				'barge (heard by all), monitor (listen only), whisper (heard only by the Whisper Call Control IDs) or none.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Barge', value: 'barge' },
					{ label: 'Monitor', value: 'monitor' },
					{ label: 'Whisper', value: 'whisper' },
					{ label: 'None', value: 'none' },
				],
			},
		}),
		whisperCallControlIds: Property.Array({
			displayName: 'Whisper Call Control IDs',
			description: 'Call control IDs of the participants a whispering supervisor is heard by.',
			required: false,
		}),
		beepEnabled: Property.StaticDropdown({
			displayName: 'Beep',
			description: 'When to play a beep as participants join or leave.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Always', value: 'always' },
					{ label: 'Never', value: 'never' },
					{ label: 'On Enter', value: 'on_enter' },
					{ label: 'On Exit', value: 'on_exit' },
				],
			},
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.runConferenceCommand({
			auth: context.auth,
			conferenceId: p.conferenceId,
			command: 'join',
			body: telnyxUtils.compact({
				values: {
					call_control_id: p.callControlId,
					client_state: p.clientState,
					command_id: p.commandId,
					end_conference_on_exit: p.endConferenceOnExit,
					soft_end_conference_on_exit: p.softEndConferenceOnExit,
					hold: p.hold,
					hold_audio_url: p.holdAudioUrl,
					hold_media_name: p.holdMediaName,
					mute: p.mute,
					start_conference_on_enter: p.startConferenceOnEnter,
					supervisor_role: p.supervisorRole,
					whisper_call_control_ids: p.whisperCallControlIds,
					beep_enabled: p.beepEnabled,
				},
			}),
		});
	},
});
