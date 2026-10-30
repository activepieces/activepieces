import { createAction, Property } from '@activepieces/pieces-framework';

import { imageRouterAuth } from '../../auth';
import { imageRouterAiProps } from '../../common/ai-props';
import { imageRouterApi } from '../../common/api';
import { imageRouterImageOutputSchema } from '../../output-schemas';

export const generateImageAction = createAction({
	auth: imageRouterAuth,
	name: 'image_router_generate_image',
	outputSchema: imageRouterImageOutputSchema,
	displayName: 'Generate Image',
	description: 'Generates images from a text prompt and returns their URLs.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Generates new images from a text prompt with the chosen ImageRouter model and returns hosted image URLs (kept 30 days), plus the credits charged. Use Edit Image instead when you have source images to transform. Pick a model whose output_modalities include image from List Models; free models such as "test/test" cost nothing. Not idempotent: each call runs and bills a new generation.',
		idempotent: false,
	},
	props: {
		model: imageRouterAiProps.model({ required: true }),
		prompt: Property.LongText({
			displayName: 'Prompt',
			description: 'What the image should show.',
			required: true,
		}),
		quality: imageRouterAiProps.quality({ required: false }),
		size: imageRouterAiProps.size({ required: false }),
		outputFormat: imageRouterAiProps.outputFormat({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await imageRouterApi.createImage({ auth, ...propsValue });
	},
});
