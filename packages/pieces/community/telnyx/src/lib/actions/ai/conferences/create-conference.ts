import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxCreateConferenceAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_create_conference',
	displayName: 'Create Conference',
	description: 'Creates a conference from an active call.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a conference and places an active, answered call in it as the first participant. Needs the call_control_id of a live call (from Dial Call). Other calls join with Join Conference. Not idempotent: every call creates a new conference.',
		idempotent: false,
	},
	props: {
		callControlId: telnyxAiProps.callControlId({ required: true }),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Name of the conference.',
			required: true,
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
		clientState: telnyxAiProps.clientState({ required: false }),
		comfortNoise: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Comfort Noise',
			description:
				'Whether to play comfort noise when only one participant is in the conference. Defaults to Yes.',
		}),
		commandId: telnyxAiProps.commandId({ required: false }),
		durationMinutes: Property.Number({
			displayName: 'Duration (minutes)',
			description: 'Time in minutes after which the conference ends automatically.',
			required: false,
		}),
		holdAudioUrl: Property.ShortText({
			displayName: 'Hold Audio URL',
			description: 'URL of audio played to participants on hold.',
			required: false,
		}),
		holdMediaName: Property.ShortText({
			displayName: 'Hold Media Name',
			description:
				'Name of uploaded media played to participants on hold (from Upload Media). Ignored if Hold Audio URL is set.',
			required: false,
		}),
		maxParticipants: Property.Number({
			displayName: 'Max Participants',
			description: 'Maximum number of participants (up to 250).',
			required: false,
		}),
		startConferenceOnCreate: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Start On Create',
			description:
				'Whether the conference starts right away. If No, it starts when a participant joins with Start Conference On Enter. Defaults to Yes.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.createConference({
			auth: context.auth,
			body: telnyxUtils.compact({
				values: {
					call_control_id: p.callControlId,
					name: p.name,
					beep_enabled: p.beepEnabled,
					client_state: p.clientState,
					comfort_noise: p.comfortNoise,
					command_id: p.commandId,
					duration_minutes: p.durationMinutes,
					hold_audio_url: p.holdAudioUrl,
					hold_media_name: p.holdMediaName,
					max_participants: p.maxParticipants,
					start_conference_on_create: p.startConferenceOnCreate,
				},
			}),
		});
	},
});
