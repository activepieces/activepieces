import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { placidAuth } from '../common/auth';
import { placidApiCall } from '../common/client';

export const getImageAction = createAction({
	name: 'get-image',
	auth: placidAuth,
	displayName: 'Get Image',
	description: 'Retrieve a previously generated image by its ID.',
	props: {
		imageId: Property.ShortText({
			displayName: 'Image ID',
			description: 'The ID of the image to retrieve (returned from create image API).',
			required: true,
		}),
	},
	async run({ propsValue, auth }) {
		const { imageId } = propsValue;

		const response = await placidApiCall({
			apiKey: auth,
			method: HttpMethod.GET,
			resourceUri: `/images/${imageId}`,
		});

		return response;
	},
});
