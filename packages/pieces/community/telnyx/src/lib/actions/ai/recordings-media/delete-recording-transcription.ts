import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxDeleteRecordingTranscriptionAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_delete_recording_transcription',
	displayName: 'Delete Recording Transcription',
	description: 'Permanently deletes a recording transcription.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a recording transcription; the recording itself stays. Cannot be undone. Returns the deleted transcription.',
		idempotent: false,
	},
	props: {
		transcriptionId: Property.ShortText({
			displayName: 'Transcription ID',
			description: 'Recording transcription ID, from List Recording Transcriptions.',
			required: true,
		}),
	},
	async run(context) {
		return await telnyxApi.deleteRecordingTranscription({
			auth: context.auth,
			transcriptionId: context.propsValue.transcriptionId,
		});
	},
});
