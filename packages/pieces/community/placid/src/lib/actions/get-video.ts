import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { placidAuth } from '../common/auth';
import { placidApiCall } from '../common/client';

export const getVideoAction = createAction({
	name: 'get-video',
	auth: placidAuth,
	displayName: 'Get Video',
	description: 'Retrieve a previously generated video by its ID.',
	props: {
		videoId: Property.ShortText({
			displayName: 'Video ID',
			description: 'The ID of the video to retrieve (returned from the Create Video API).',
			required: true,
		}),
	},
	async run({ propsValue, auth }) {
		const { videoId } = propsValue;

		const response = await placidApiCall({
			apiKey: auth,
			method: HttpMethod.GET,
			resourceUri: `/videos/${videoId}`,
		});

		return response;
	},
});
