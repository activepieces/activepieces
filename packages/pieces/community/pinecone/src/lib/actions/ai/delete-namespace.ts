import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeAiProps } from '../../common/ai-props';
import { pineconeClient } from '../../common/client';
import { pineconeDeleteNamespaceOutputSchema } from '../../output-schemas';

export const pineconeDeleteNamespaceAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_delete_namespace',
	outputSchema: pineconeDeleteNamespaceOutputSchema,
	displayName: 'Delete Namespace',
	description: 'Permanently deletes a namespace and all its records.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a namespace and every record in it; this cannot be undone. Serverless indexes only.',
		idempotent: false,
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
		await index.deleteNamespace(p.namespace);
		return { deleted: true, namespace: p.namespace };
	},
});
