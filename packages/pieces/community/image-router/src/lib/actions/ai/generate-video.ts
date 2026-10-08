import { createAction, Property } from '@activepieces/pieces-framework';

import { imageRouterAuth } from '../../auth';
import { imageRouterAiProps } from '../../common/ai-props';
import { imageRouterApi } from '../../common/api';
import { imageRouterGenerateVideoOutputSchema } from '../../output-schemas';

export const generateVideoAction = createAction({
	auth: imageRouterAuth,
	name: 'image_router_generate_video',
	outputSchema: imageRouterGenerateVideoOutputSchema,
	displayName: 'Generate Video',
	description: 'Generates a video from a prompt and an optional start image, and returns its URL.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Generates a video with the chosen ImageRouter video model from a text prompt and/or one start image (http(s) URL or data URI), waits for it to finish, and returns the hosted video URL (kept 30 days) plus the credits charged. Pick a model whose output_modalities include video from List Models and check its allowed sizes and seconds with Get Model; "ir/test-video" is free. Not idempotent: each call runs and bills a new generation.',
		idempotent: false,
	},
	props: {
		model: imageRouterAiProps.model({
			required: true,
			description:
				'Video model id, e.g. "ir/test-video". Use List Models with output modality "video" to find ids.',
		}),
		prompt: Property.LongText({
			displayName: 'Prompt',
			description: 'What the video should show. Most models need one.',
			required: false,
		}),
		image: Property.ShortText({
			displayName: 'Start Image',
			description: 'Optional start image for image-to-video models: an http(s) URL or a data URI.',
			required: false,
		}),
		size: imageRouterAiProps.size({
			required: false,
			description:
				'"auto" or WIDTHxHEIGHT such as "1280x720". Allowed sizes per model are in Get Model (sizes). Defaults to auto.',
		}),
		seconds: Property.Number({
			displayName: 'Duration (seconds)',
			description:
				'Video length in seconds; allowed values per model are in Get Model (seconds). Defaults to the model default.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await imageRouterApi.createVideo({ auth, ...propsValue });
	},
});
