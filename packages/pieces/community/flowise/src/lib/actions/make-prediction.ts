import { createAction, Property } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../auth';
import { flowiseApi } from '../common/api';

export const makePredictionAction = createAction({
	name: 'make_prediction',
	classification: 'WRITE',
	displayName: 'Make Prediction',
	description: 'Run Flowise Predict',
	audience: 'both',
	aiMetadata: {
		description:
			'Sends a question/input to a specific Flowise chatflow by its Chatflow ID and returns the prediction, optionally passing prior conversation history and runtime override config. Use to invoke a deployed Flowise AI workflow (chatbot, RAG, agent) for inference. Requires the target Chatflow ID; not idempotent since each call generates a fresh model response.',
		idempotent: false,
	},
	auth: flowiseAuth,
	props: {
		chatflow_id: Property.ShortText({
			displayName: 'Chatflow ID',
			description: 'Enter the Chatflow ID',
			required: true,
		}),
		input: Property.ShortText({
			displayName: 'Input/Question',
			description: 'Enter the Input/Question',
			required: true,
		}),
		history: Property.Json({
			displayName: 'History',
			description: 'Enter the History',
			required: false,
		}),
		overrideConfig: Property.Json({
			displayName: 'Override Config',
			description: 'Enter the Override Config',
			required: false,
		}),
	},
	async run(ctx) {
		return await flowiseApi.createPrediction({
			auth: ctx.auth,
			chatflowId: ctx.propsValue.chatflow_id,
			question: ctx.propsValue.input,
			history: ctx.propsValue.history,
			overrideConfig: ctx.propsValue.overrideConfig,
		});
	},
});
