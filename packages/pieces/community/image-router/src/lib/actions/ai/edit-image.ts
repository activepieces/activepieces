import { createAction, Property } from '@activepieces/pieces-framework';

import { imageRouterAuth } from '../../auth';
import { imageRouterAiProps } from '../../common/ai-props';
import { imageRouterApi } from '../../common/api';
import { imageRouterImageOutputSchema } from '../../output-schemas';

export const editImageAction = createAction({
	auth: imageRouterAuth,
	name: 'image_router_edit_image',
	outputSchema: imageRouterImageOutputSchema,
	displayName: 'Edit Image',
	description: 'Transforms or inpaints existing images and returns the new image URLs.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sends 1 to 16 source images (http(s) URLs or data URIs) with an optional prompt and optional masks to an ImageRouter editing model, and returns hosted URLs of the new images plus the credits charged. Use for image-to-image work (style transfer, inpainting, combining images); use Generate Image when there is no source image. The model must accept image input (input_modalities include image in List Models); masks only work with models listing mask. Not idempotent: each call runs and bills a new generation.',
		idempotent: false,
	},
	props: {
		model: imageRouterAiProps.model({ required: true }),
		images: Property.Array({
			displayName: 'Images',
			description:
				'Source images, 1 to 16, each an http(s) URL or a data URI such as "data:image/png;base64,...".',
			required: true,
		}),
		prompt: Property.LongText({
			displayName: 'Prompt',
			description: 'How to change the images. Most models need one; a few (e.g. upscalers) do not.',
			required: false,
		}),
		masks: Property.Array({
			displayName: 'Masks',
			description:
				'Optional mask images (URL or data URI) marking the area to edit, for models that support masks.',
			required: false,
		}),
		quality: imageRouterAiProps.quality({ required: false }),
		size: imageRouterAiProps.size({ required: false }),
		outputFormat: imageRouterAiProps.outputFormat({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await imageRouterApi.createImage({ auth, ...propsValue });
	},
});
