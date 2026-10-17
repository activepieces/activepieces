import { createAction } from '@activepieces/pieces-framework';

import { runwareAuth } from '../../auth';
import { runwareAiProps } from '../../common/ai-props';
import { runwareApi } from '../../common/api';

export const vectorizeImageAction = createAction({
	auth: runwareAuth,
	name: 'runware_vectorize_image',
	displayName: 'Vectorize Image',
	description: 'Converts a raster image to SVG.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Converts a raster image to an SVG vector using a Runware vectorize model and returns the SVG URL, UUID and cost. Each call is billed.',
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
				taskType: 'vectorize',
				includeCost: true,
				...params,
				inputs: { image },
			},
		});
	},
});
