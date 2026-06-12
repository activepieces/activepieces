import { createAction, Property } from '@activepieces/pieces-framework';
import { placidAuth } from '../auth';
import { PlacidClient } from '../common/client';

export const getImage = createAction({
	auth: placidAuth,
	name: 'get_image',
	displayName: 'Get Image',
	description: 'Retrieves a generated image by its ID.',
	audience: 'both',
	aiMetadata: { description: 'Look up a previously created Placid image by its ID to read its current status and download URL. Use this to poll a queued render to completion or fetch the result of an earlier Create Image call. Requires the image ID. Idempotent read-only lookup.', idempotent: true },
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
