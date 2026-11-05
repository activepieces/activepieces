import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxStopCallRecordingAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_stop_call_recording',
	displayName: 'Stop Call Recording',
	description: 'Stops recording an active call.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Stops a recording started by Start Call Recording. The finished recording then shows up in List Recordings (a call.recording.saved webhook also fires).',
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
			command: 'record_stop',
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
