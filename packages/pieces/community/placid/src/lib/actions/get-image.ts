import { createAction, Property } from '@activepieces/pieces-framework';
import { placidAuth } from '../../index';
import { PlacidClient } from '../common/client';

export const getImage = createAction({
	auth: placidAuth,
	name: 'get_image',
	displayName: 'Get Image',
	description: 'Retrieves a generated image by its ID.',
	props: {
		imageId: Property.ShortText({
			displayName: 'Image ID',
			description: 'The ID of the image to retrieve.',
			required: true,
		}),
	},
	async run(context) {
		const { imageId } = context.propsValue;
		const client = new PlacidClient(context.auth);
		return await client.getImage(imageId);
	},
});
