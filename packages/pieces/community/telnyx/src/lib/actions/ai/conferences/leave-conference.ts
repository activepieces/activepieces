import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxLeaveConferenceAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_leave_conference',
	displayName: 'Leave Conference',
	description: 'Removes a call from a conference.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Removes a participant call from a conference without hanging up the call. Use Hangup Call to end the call itself.',
		idempotent: false,
	},
	props: {
		conferenceId: Property.ShortText({
			displayName: 'Conference ID',
			description: 'Conference ID, returned by Create Conference or List Conferences.',
			required: true,
		}),
		callControlId: telnyxAiProps.callControlId({ required: true }),
		commandId: telnyxAiProps.commandId({ required: false }),
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
			command: 'leave',
			body: telnyxUtils.compact({
				values: {
					call_control_id: p.callControlId,
					command_id: p.commandId,
					beep_enabled: p.beepEnabled,
				},
			}),
		});
	},
});
