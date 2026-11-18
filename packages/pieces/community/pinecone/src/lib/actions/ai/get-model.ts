import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeClient } from '../../common/client';
import { pineconeGetModelOutputSchema } from '../../output-schemas';

export const pineconeGetModelAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_get_model',
	outputSchema: pineconeGetModelOutputSchema,
	displayName: 'Get Model',
	description: 'Gets details of one hosted model.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one hosted model by name: type, supported dimensions, metrics, parameters and limits.',
		idempotent: true,
	},
	props: {
		modelName: Property.ShortText({
			displayName: 'Model Name',
			description: 'Hosted model name, from List Models, e.g. "llama-text-embed-v2".',
			required: true,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		const client = pineconeClient.create({ auth: context.auth });
		return await client.inference.getModel(p.modelName);
	},
});
