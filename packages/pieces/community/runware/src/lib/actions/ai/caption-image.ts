import { createAction, Property } from '@activepieces/pieces-framework';

import { runwareAuth } from '../../auth';
import { runwareAiProps } from '../../common/ai-props';
import { runwareApi } from '../../common/api';

export const captionImageAction = createAction({
	auth: runwareAuth,
	name: 'runware_caption_image',
	displayName: 'Caption Image',
	description: 'Describes an image in text.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Describes an image in text with a Runware captioning model, optionally steered by a question in Prompt; some models instead return a classification such as an age estimate. Returns the text and cost. Each call is billed.',
		idempotent: false,
	},
	props: {
		model: runwareAiProps.model({ required: true }),
		image: runwareAiProps.image({ required: true }),
		prompt: Property.LongText({
			displayName: 'Prompt',
			description: 'Optional instruction or question about the image, for models that take one.',
			required: false,
		}),
		additionalParams: runwareAiProps.additionalParams({ required: false }),
	},
	async run({ auth, propsValue }) {
		const { additionalParams, image, ...params } = propsValue;
		return await runwareApi.runTask({
			auth,
			task: {
				...additionalParams,
				taskType: 'caption',
				includeCost: true,
				...params,
				inputs: { image },
			},
		});
	},
});
