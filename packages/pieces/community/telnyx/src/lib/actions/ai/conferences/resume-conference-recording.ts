import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxResumeConferenceRecordingAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_resume_conference_recording',
	displayName: 'Resume Conference Recording',
	description: 'Resumes a paused conference recording.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Resumes a conference recording paused with Pause Conference Recording.',
		idempotent: true,
	},
	props: {
		conferenceId: Property.ShortText({
			displayName: 'Conference ID',
			description: 'Conference ID, returned by Create Conference or List Conferences.',
			required: true,
		}),
		recordingId: Property.ShortText({
			displayName: 'Recording ID',
			description:
				'Optional ID of the recording to target. Leave empty to target the current recording.',
			required: false,
		}),
		commandId: telnyxAiProps.commandId({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.runConferenceCommand({
			auth: context.auth,
			conferenceId: p.conferenceId,
			command: 'record_resume',
			body: telnyxUtils.compact({
				values: {
					recording_id: p.recordingId,
					command_id: p.commandId,
				},
			}),
		});
	},
});
