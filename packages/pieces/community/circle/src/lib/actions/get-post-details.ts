import { createAction } from '@activepieces/pieces-framework';
import { BASE_URL, spaceIdDropdown, postIdDropdown } from '../common';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { circleAuth } from '../common/auth';
import { PostDetails } from '../common/types';

export const getPostDetailsAction = createAction({
	auth: circleAuth,
	name: 'get_post_details',
	displayName: 'Get Post Details',
	description: 'Retrieves the complete details of a specific post.',
	props: {
		space_id: spaceIdDropdown,
		post_id: postIdDropdown,
	},
	async run(context) {
		const { post_id } = context.propsValue;

		if (post_id === undefined) {
			throw new Error('Post ID is undefined, but it is a required field.');
		}

		const response = await httpClient.sendRequest<PostDetails>({
			method: HttpMethod.GET,
			url: `${BASE_URL}/posts/${post_id}`,
			headers: {
				Authorization: `Bearer ${context.auth}`,
				'Content-Type': 'application/json',
			},
		});
		return response.body;
	},
});
