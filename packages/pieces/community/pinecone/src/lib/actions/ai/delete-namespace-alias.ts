import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeAiProps } from '../../common/ai-props';
import { pineconeApi } from '../../common/api';
import { pineconeDeleteNamespaceAliasOutputSchema } from '../../output-schemas';

export const pineconeDeleteNamespaceAliasAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_delete_namespace_alias',
	outputSchema: pineconeDeleteNamespaceAliasOutputSchema,
	displayName: 'Delete Namespace Alias',
	description: 'Deletes a namespace alias.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Deletes a namespace alias. The namespace it pointed to and its records are kept.',
		idempotent: false,
	},
	props: {
		indexName: pineconeAiProps.indexName({ required: true }),
		aliasName: Property.ShortText({
			displayName: 'Alias Name',
			description: 'Namespace alias name, from List Namespace Aliases.',
			required: true,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		await pineconeApi.deleteNamespaceAlias({
			auth: context.auth,
			indexName: p.indexName,
			aliasName: p.aliasName,
		});
		return { deleted: true, aliasName: p.aliasName };
	},
});
