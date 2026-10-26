import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxPauseCallRecordingAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_pause_call_recording',
	displayName: 'Pause Call Recording',
	description: 'Pauses recording an active call.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Pauses a running call recording, e.g. while sensitive details are read out. Resume it with Resume Call Recording.',
		idempotent: false,
	},
	props: {
		callControlId: telnyxAiProps.callControlId({ required: true }),
		recordingId: Property.ShortText({
			displayName: 'Recording ID',
			description:
				'Optional recording UUID when the call has several recordings; defaults to the active one.',
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
			command: 'record_pause',
			body: telnyxUtils.compact({
				values: {
					recording_id: p.recordingId,
					client_state: p.clientState,
					command_id: p.commandId,
				},
			}),
		});
	},
});
