import { createAction, Property } from '@activepieces/pieces-framework';

import { runwareAuth } from '../../auth';
import { runwareAiProps } from '../../common/ai-props';
import { runwareApi } from '../../common/api';

export const generateImageAction = createAction({
	auth: runwareAuth,
	name: 'runware_generate_image',
	displayName: 'Generate Image',
	description: 'Generates images from a prompt, optionally guided by input images.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Generates one or more images with any Runware image model (text-to-image, or image-to-image and editing through Inputs such as seedImage or referenceImages) and returns their URLs, UUIDs and cost. Pick the model with Search Models; send only parameters that model accepts. Each call is a new paid generation.',
		idempotent: false,
	},
	props: {
		model: runwareAiProps.model({ required: true }),
		positivePrompt: runwareAiProps.positivePrompt({ required: true }),
		negativePrompt: runwareAiProps.negativePrompt({ required: false }),
		width: runwareAiProps.width({ required: false }),
		height: runwareAiProps.height({ required: false }),
		numberResults: runwareAiProps.numberResults({ required: false }),
		seed: runwareAiProps.seed({ required: false }),
		outputFormat: runwareAiProps.outputFormat({ required: false }),
		inputs: runwareAiProps.inputs({ required: false }),
		settings: runwareAiProps.settings({ required: false }),
		additionalParams: runwareAiProps.additionalParams({ required: false }),
	},
	async run({ auth, propsValue }) {
		const { additionalParams, ...params } = propsValue;
		return await runwareApi.runTask({
			auth,
			task: { ...additionalParams, taskType: 'imageInference', includeCost: true, ...params },
		});
	},
});
