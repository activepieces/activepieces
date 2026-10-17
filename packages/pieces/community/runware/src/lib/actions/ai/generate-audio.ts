import { createAction, Property } from '@activepieces/pieces-framework';

import { runwareAuth } from '../../auth';
import { runwareAiProps } from '../../common/ai-props';
import { runwareApi } from '../../common/api';

export const generateAudioAction = createAction({
	auth: runwareAuth,
	name: 'runware_generate_audio',
	displayName: 'Generate Audio',
	description: 'Generates speech, music or sound effects.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Generates audio with any Runware audio model: text-to-speech through Speech ({"text", "voice"}), or music and sound effects from a prompt. Returns the audio URL, UUID and cost. If the model runs asynchronously the response holds only the taskUUID; poll it with Get Task Result. Each call is a new paid generation.',
		idempotent: false,
	},
	props: {
		model: runwareAiProps.model({ required: true }),
		positivePrompt: runwareAiProps.positivePrompt({ required: false }),
		speech: Property.Json({
			displayName: 'Speech',
			description:
				'For text-to-speech models: {"text": "Hello", "voice": "<voice id from the model page>"}.',
			required: false,
		}),
		duration: Property.Number({
			displayName: 'Duration',
			description: 'Audio length in seconds, for models that take one.',
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
			task: { ...additionalParams, taskType: 'audioInference', includeCost: true, ...params },
		});
	},
});
