import { createAction, Property } from '@activepieces/pieces-framework';

import { runwareAuth } from '../../auth';
import { runwareAiProps } from '../../common/ai-props';
import { runwareApi } from '../../common/api';

export const enhancePromptAction = createAction({
	auth: runwareAuth,
	name: 'runware_enhance_prompt',
	displayName: 'Enhance Prompt',
	description: 'Rewrites a short prompt into richer prompt variations.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Expands a short image or video prompt into one or more richer, more descriptive prompt versions with the Runware prompt-enhancer model, ready to pass to Generate Image or Generate Video. Each call is billed and output varies.',
		idempotent: false,
	},
	props: {
		model: runwareAiProps.model({ required: true }),
		prompt: Property.LongText({
			displayName: 'Prompt',
			description: 'The prompt to enhance.',
			required: true,
		}),
		promptMaxLength: Property.Number({
			displayName: 'Max Length',
			description: 'Maximum length of each enhanced prompt, in characters.',
			required: false,
		}),
		promptVersions: Property.Number({
			displayName: 'Versions',
			description: 'How many enhanced versions to return. Defaults to 1.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await runwareApi.runTask({
			auth,
			task: { taskType: 'promptEnhance', includeCost: true, ...propsValue },
		});
	},
});
