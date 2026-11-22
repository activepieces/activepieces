import { createAction, Property } from '@activepieces/pieces-framework';
import { placidAuth } from '../auth';
import { PlacidClient } from '../common/client';
import { placidSchemas } from '../common/output-schemas';

export const getVideo = createAction({
	auth: placidAuth,
	name: 'get_video',
	classification: 'READ',
	displayName: 'Get Video',
	description: 'Retrieves the generated video by its ID.',
	audience: 'both',
	aiMetadata: { description: 'Look up a previously created Placid video by its ID to read its current status and download URL. Use this to poll a queued render to completion or fetch the result of an earlier Create Video call. Requires the video ID. Idempotent read-only lookup.', idempotent: true },
	outputSchema: placidSchemas.video,
	props: {
		videoId: Property.ShortText({
			displayName: 'Video ID',
			description: 'The ID of the video to retrieve.',
			placeholder: '136034145',
			required: true,
		}),
	},
	async run(context) {
		const { videoId } = context.propsValue;
		const client = new PlacidClient(context.auth);
		return await client.getVideo(videoId);
	},
});
