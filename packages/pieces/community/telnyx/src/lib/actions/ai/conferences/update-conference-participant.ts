import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxUpdateConferenceParticipantAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_update_conference_participant',
	displayName: 'Update Conference Participant',
	description: 'Updates the exit and beep settings of a participant.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Changes a participant's end-on-exit and beep settings, leaving unset ones as they are. To mute, hold or change a supervisor role use the dedicated conference actions.",
		idempotent: true,
	},
	props: {
		conferenceId: Property.ShortText({
			displayName: 'Conference ID',
			description: 'Conference ID, returned by Create Conference or List Conferences.',
			required: true,
		}),
		participantId: Property.ShortText({
			displayName: 'Participant ID',
			description: 'Participant ID or call_control_id, from List Conference Participants.',
			required: true,
		}),
		endConferenceOnExit: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'End Conference On Exit',
			description: 'Whether the conference ends for everyone when this participant leaves.',
		}),
		softEndConferenceOnExit: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Soft End Conference On Exit',
			description:
				'Whether the conference ends once this participant leaves, letting other participants finish their current audio.',
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
		return await telnyxApi.updateConferenceParticipant({
			auth: context.auth,
			conferenceId: p.conferenceId,
			participantId: p.participantId,
			body: telnyxUtils.compact({
				values: {
					end_conference_on_exit: p.endConferenceOnExit,
					soft_end_conference_on_exit: p.softEndConferenceOnExit,
					beep_enabled: p.beepEnabled,
				},
			}),
		});
	},
});
