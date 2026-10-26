import { createAction, Property } from '@activepieces/pieces-framework';

import { runwareAuth } from '../../auth';
import { runwareAiProps } from '../../common/ai-props';
import { runwareApi } from '../../common/api';

export const generateVideoAction = createAction({
	auth: runwareAuth,
	name: 'runware_generate_video',
	displayName: 'Generate Video',
	description: 'Starts a video generation and returns its task UUID.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Starts an asynchronous video generation with any Runware video model (text-to-video, or image-to-video through Inputs such as frameImages) and returns the taskUUID. Poll Get Task Result with that taskUUID until the status is success to get the video URL. Each call is a new paid generation.',
		idempotent: false,
	},
	props: {
		model: runwareAiProps.model({ required: true }),
		positivePrompt: runwareAiProps.positivePrompt({ required: false }),
		negativePrompt: runwareAiProps.negativePrompt({ required: false }),
		width: runwareAiProps.width({ required: false }),
		height: runwareAiProps.height({ required: false }),
		duration: Property.Number({
			displayName: 'Duration',
			description: "Video length in seconds, within the model's allowed values.",
			required: false,
		}),
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
			task: {
				...additionalParams,
				taskType: 'videoInference',
				deliveryMethod: 'async',
				includeCost: true,
				...params,
			},
		});
	},
});
