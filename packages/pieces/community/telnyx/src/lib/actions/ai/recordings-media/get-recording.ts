import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxGetRecordingAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_get_recording',
	displayName: 'Get Recording',
	description: 'Gets a call recording.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one recording by id, including its status, duration and temporary download URLs (MP3/WAV).',
		idempotent: true,
	},
	props: {
		recordingId: Property.ShortText({
			displayName: 'Recording ID',
			description: 'Recording ID, from List Recordings.',
			required: true,
		}),
	},
	async run(context) {
		return await telnyxApi.getRecording({
			auth: context.auth,
			recordingId: context.propsValue.recordingId,
		});
	},
});
