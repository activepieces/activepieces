import { createAction } from '@activepieces/pieces-framework';

import { runwareAuth } from '../../auth';
import { runwareAiProps } from '../../common/ai-props';
import { runwareApi } from '../../common/api';

export const preprocessControlnetImageAction = createAction({
	auth: runwareAuth,
	name: 'runware_preprocess_controlnet_image',
	displayName: 'Preprocess ControlNet Image',
	description: 'Extracts a ControlNet guide image (edges, depth, pose and more).',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Turns an image into a ControlNet guide image (canny edges, depth, openpose, lineart and others, chosen by model) and returns the guide image URL and UUID, for use as a ControlNet input in Generate Image. Each call is billed.',
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
				taskType: 'controlNetPreprocess',
				includeCost: true,
				...params,
				inputs: { image },
			},
		});
	},
});
