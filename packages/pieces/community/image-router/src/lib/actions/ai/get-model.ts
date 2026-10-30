import { createAction, Property } from '@activepieces/pieces-framework';

import { imageRouterAuth } from '../../auth';
import { imageRouterApi } from '../../common/api';
import { imageRouterGetModelOutputSchema } from '../../output-schemas';

export const getModelAction = createAction({
	auth: imageRouterAuth,
	name: 'image_router_get_model',
	outputSchema: imageRouterGetModelOutputSchema,
	displayName: 'Get Model',
	description: 'Gets one ImageRouter model with its parameters and pricing.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one ImageRouter model by exact id (e.g. "openai/gpt-image-2"): its input and output modalities, supported parameters (quality, size, seconds, mask, or OpenAI text parameters), allowed sizes and durations, context length for text models, and pricing. Use it before a generation to choose valid size, quality or seconds values. Ids come from List Models. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		modelId: Property.ShortText({
			displayName: 'Model ID',
			description: 'Exact model id, e.g. "openai/gpt-image-2", from List Models.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		return await imageRouterApi.getModel({ auth, modelId: propsValue.modelId });
	},
});
