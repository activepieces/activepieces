import { createAction } from '@activepieces/pieces-framework';

import { runwareAuth } from '../../auth';
import { runwareAiProps } from '../../common/ai-props';
import { runwareApi } from '../../common/api';

export const createImageMaskAction = createAction({
	auth: runwareAuth,
	name: 'runware_create_image_mask',
	displayName: 'Create Image Mask',
	description: 'Detects objects such as faces, hands or people and returns a mask.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Detects objects in an image with a Runware masking model (faces, hands, people and similar, by model) and returns a black-and-white mask image URL plus the detection boxes. Tune confidence, maxDetections, maskPadding and maskBlur in Settings. Each call is billed.',
		idempotent: false,
	},
	props: {
		model: runwareAiProps.model({ required: true }),
		image: runwareAiProps.image({ required: true }),
		outputFormat: runwareAiProps.outputFormat({ required: false }),
		settings: runwareAiProps.settings({ required: false }),
		additionalParams: runwareAiProps.additionalParams({ required: false }),
	},
	async run({ auth, propsValue }) {
		const { additionalParams, image, ...params } = propsValue;
		return await runwareApi.runTask({
			auth,
			task: {
				...additionalParams,
				taskType: 'imageMasking',
				includeCost: true,
				...params,
				inputs: { image },
			},
		});
	},
});
