import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxListRecordingTranscriptionsAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_recording_transcriptions',
	displayName: 'List Recording Transcriptions',
	description: 'Lists transcriptions of call recordings.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of recording transcriptions with their text, status and recording_id. They are created when Start Call Recording runs with transcription enabled. Filter by recording or creation time.',
		idempotent: true,
	},
	props: {
		recordingId: Property.ShortText({
			displayName: 'Recording ID',
			description: 'Only return the transcription of this recording.',
			required: false,
		}),
		createdAfter: Property.DateTime({
			displayName: 'Created After',
			description: 'Only return transcriptions created at or after this time.',
			required: false,
		}),
		createdBefore: Property.DateTime({
			displayName: 'Created Before',
			description: 'Only return transcriptions created at or before this time.',
			required: false,
		}),
		pageNumber: telnyxAiProps.pageNumber({ required: false }),
		pageSize: telnyxAiProps.pageSize({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.listRecordingTranscriptions({
			auth: context.auth,
			query: {
				...telnyxUtils.filterQuery({ filters: { recording_id: p.recordingId } }),
				...telnyxUtils.toQuery({
					values: {
						'filter[created_at][gte]': p.createdAfter,
						'filter[created_at][lte]': p.createdBefore,
					},
				}),
				...telnyxUtils.pageQuery({ pageNumber: p.pageNumber, pageSize: p.pageSize }),
			},
		});
	},
});
