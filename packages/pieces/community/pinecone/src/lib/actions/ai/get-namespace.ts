import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeAiProps } from '../../common/ai-props';
import { pineconeClient } from '../../common/client';
import { pineconeGetNamespaceOutputSchema } from '../../output-schemas';

export const pineconeGetNamespaceAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_get_namespace',
	outputSchema: pineconeGetNamespaceOutputSchema,
	displayName: 'Get Namespace',
	description: 'Gets one namespace of an index.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one namespace of an index by name: record count and indexed metadata fields.',
		idempotent: true,
	},
	props: {
		indexName: pineconeAiProps.indexName({ required: true }),
		namespace: Property.ShortText({
			displayName: 'Namespace',
			description: 'Namespace name, from List Namespaces.',
			required: true,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		const client = pineconeClient.create({ auth: context.auth });
		const index = client.index({ name: p.indexName });
		return await index.describeNamespace(p.namespace);
	},
});
