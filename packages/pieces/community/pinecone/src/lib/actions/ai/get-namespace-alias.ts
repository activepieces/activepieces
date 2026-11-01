import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeAiProps } from '../../common/ai-props';
import { pineconeApi } from '../../common/api';
import { pineconeCreateNamespaceAliasOutputSchema } from '../../output-schemas';

export const pineconeGetNamespaceAliasAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_get_namespace_alias',
	outputSchema: pineconeCreateNamespaceAliasOutputSchema,
	displayName: 'Get Namespace Alias',
	description: 'Gets one namespace alias.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets one namespace alias by name and the namespace it points to.',
		idempotent: true,
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
		return await pineconeApi.getNamespaceAlias({
			auth: context.auth,
			indexName: p.indexName,
			aliasName: p.aliasName,
		});
	},
});
