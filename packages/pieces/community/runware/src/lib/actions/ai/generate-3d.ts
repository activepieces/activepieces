import { createAction, Property } from '@activepieces/pieces-framework';

import { runwareAuth } from '../../auth';
import { runwareAiProps } from '../../common/ai-props';
import { runwareApi } from '../../common/api';

export const generate3dAction = createAction({
	auth: runwareAuth,
	name: 'runware_generate_3d',
	displayName: 'Generate 3D Model',
	description: 'Starts a 3D model generation and returns its task UUID.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Starts an asynchronous 3D mesh generation with any Runware 3D model, from a prompt or from images in Inputs ({"images": ["<url>"]}), and returns the taskUUID. Poll Get Task Result with that taskUUID until the status is success to get the mesh file URLs. Each call is a new paid generation.',
		idempotent: false,
	},
	props: {
		model: runwareAiProps.model({ required: true }),
		positivePrompt: runwareAiProps.positivePrompt({ required: false }),
		negativePrompt: runwareAiProps.negativePrompt({ required: false }),
		seed: runwareAiProps.seed({ required: false }),
		outputFormat: runwareAiProps.outputFormat({
			required: false,
			description: 'Mesh format the model supports, e.g. "GLB". Defaults to the model\'s default.',
		}),
		inputs: runwareAiProps.inputs({
			required: false,
			description: 'Source images, e.g. {"images": ["<url>"]}.',
		}),
		settings: runwareAiProps.settings({ required: false }),
		additionalParams: runwareAiProps.additionalParams({ required: false }),
	},
	async run({ auth, propsValue }) {
		const { additionalParams, ...params } = propsValue;
		return await runwareApi.runTask({
			auth,
			task: {
				...additionalParams,
				taskType: '3dInference',
				deliveryMethod: 'async',
				includeCost: true,
				...params,
			},
		});
	},
});
