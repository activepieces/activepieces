import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxResumeCallRecordingAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_resume_call_recording',
	displayName: 'Resume Call Recording',
	description: 'Resumes a paused call recording.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Resumes a call recording paused with Pause Call Recording.',
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
			command: 'record_resume',
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
