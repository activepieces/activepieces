import { createAction, Property } from '@activepieces/pieces-framework';
import { placidAuth } from '../../index';
import { PlacidClient } from '../common/client';

export const getVideo = createAction({
	auth: placidAuth,
	name: 'get_video',
	displayName: 'Get Video',
	description: 'Retrieves the generated video by its ID.',
	props: {
		videoId: Property.ShortText({
			displayName: 'Video ID',
			description: 'The ID of the video to retrieve.',
			required: true,
		}),
	},
	async run(context) {
		const { videoId } = context.propsValue;
		const client = new PlacidClient(context.auth);
		return await client.getVideo(videoId);
	},
});
