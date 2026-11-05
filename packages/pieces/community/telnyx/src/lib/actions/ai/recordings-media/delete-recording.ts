import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxDeleteRecordingAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_delete_recording',
	displayName: 'Delete Recording',
	description: 'Permanently deletes a call recording.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a recording and its stored audio. Cannot be undone. Returns the deleted recording.',
		idempotent: false,
	},
	props: {
		recordingId: Property.ShortText({
			displayName: 'Recording ID',
			description: 'Recording ID, from List Recordings.',
			required: true,
		}),
	},
	async run(context) {
		return await telnyxApi.deleteRecording({
			auth: context.auth,
			recordingId: context.propsValue.recordingId,
		});
	},
});
