import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxStopConferenceRecordingAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_stop_conference_recording',
	displayName: 'Stop Conference Recording',
	description: 'Stops recording a conference.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Stops a conference recording started with Start Conference Recording. The saved recording then appears in List Recordings.',
		idempotent: false,
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
		clientState: telnyxAiProps.clientState({ required: false }),
		commandId: telnyxAiProps.commandId({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.runConferenceCommand({
			auth: context.auth,
			conferenceId: p.conferenceId,
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
