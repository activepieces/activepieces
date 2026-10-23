import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxGetRecordingTranscriptionAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_get_recording_transcription',
	displayName: 'Get Recording Transcription',
	description: 'Gets the transcription of a call recording.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one recording transcription by id, including the transcribed text and its status.',
		idempotent: true,
	},
	props: {
		transcriptionId: Property.ShortText({
			displayName: 'Transcription ID',
			description: 'Recording transcription ID, from List Recording Transcriptions.',
			required: true,
		}),
	},
	async run(context) {
		return await telnyxApi.getRecordingTranscription({
			auth: context.auth,
			transcriptionId: context.propsValue.transcriptionId,
		});
	},
});
