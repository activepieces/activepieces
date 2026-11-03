import { createAction } from '@activepieces/pieces-framework';

import { runwareAuth } from '../../auth';
import { runwareAiProps } from '../../common/ai-props';
import { runwareApi } from '../../common/api';

export const removeBackgroundAction = createAction({
	auth: runwareAuth,
	name: 'runware_remove_background',
	displayName: 'Remove Background',
	description: 'Removes the background from an image or video.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Removes the background from an image (or a video, with a video model) using any Runware background-removal model and returns the cutout URL, UUID and cost. If the model runs asynchronously the response holds only the taskUUID; poll it with Get Task Result. Each call is billed.',
		idempotent: false,
	},
	props: {
		model: runwareAiProps.model({ required: true }),
		image: runwareAiProps.image({ required: false }),
		video: runwareAiProps.video({ required: false }),
		outputFormat: runwareAiProps.outputFormat({ required: false }),
		settings: runwareAiProps.settings({ required: false }),
		additionalParams: runwareAiProps.additionalParams({ required: false }),
	},
	async run({ auth, propsValue }) {
		const { additionalParams, image, video, ...params } = propsValue;
		return await runwareApi.runTask({
			auth,
			task: {
				...additionalParams,
				taskType: 'removeBackground',
				includeCost: true,
				...params,
				inputs: { image, video },
			},
		});
	},
});
