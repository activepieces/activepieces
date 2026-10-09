import { createAction, Property } from '@activepieces/pieces-framework';

import { runwareAuth } from '../../auth';
import { runwareAiProps } from '../../common/ai-props';
import { runwareApi } from '../../common/api';

export const generateTextAction = createAction({
	auth: runwareAuth,
	name: 'runware_generate_text',
	displayName: 'Generate Text',
	description: 'Runs a chat completion on a hosted language model.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sends a list of chat messages to any Runware language model and returns the generated text, finish reason, token usage and cost. Put the system prompt, maxTokens and temperature in Settings. If the model runs asynchronously the response holds only the taskUUID; poll it with Get Task Result. Not idempotent: output varies between calls and each call is billed.',
		idempotent: false,
	},
	props: {
		model: runwareAiProps.model({ required: true }),
		messages: Property.Array({
			displayName: 'Messages',
			description:
				'Conversation as [{"role": "user", "content": "Hi"}]; roles are "user" and "assistant".',
			required: true,
		}),
		settings: runwareAiProps.settings({
			required: false,
			description:
				'Model tuning, e.g. {"systemPrompt": "You are terse.", "maxTokens": 500, "temperature": 0.7}.',
		}),
		inputs: runwareAiProps.inputs({
			required: false,
			description: 'Attachments for models that take them, e.g. {"images": ["<url>"]}.',
		}),
		seed: runwareAiProps.seed({ required: false }),
		additionalParams: runwareAiProps.additionalParams({ required: false }),
	},
	async run({ auth, propsValue }) {
		const { additionalParams, ...params } = propsValue;
		return await runwareApi.runTask({
			auth,
			task: { ...additionalParams, taskType: 'textInference', includeCost: true, ...params },
		});
	},
});
