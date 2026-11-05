import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeAiProps } from '../../common/ai-props';
import { pineconeApi } from '../../common/api';
import { pineconeCreateNamespaceAliasOutputSchema } from '../../output-schemas';

export const pineconeCreateNamespaceAliasAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_create_namespace_alias',
	outputSchema: pineconeCreateNamespaceAliasOutputSchema,
	displayName: 'Create Namespace Alias',
	description: 'Creates an alias name that points to a namespace.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a namespace alias: a second name that reads and writes go to the target namespace through. Repoint it later with Repoint Namespace Alias to switch traffic without changing callers.',
		idempotent: false,
	},
	props: {
		indexName: pineconeAiProps.indexName({ required: true }),
		aliasName: Property.ShortText({
			displayName: 'Alias Name',
			description: 'Name of the new alias.',
			required: true,
		}),
		targetNamespace: Property.ShortText({
			displayName: 'Target Namespace',
			description: 'Namespace the alias points to, from List Namespaces.',
			required: true,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await pineconeApi.createNamespaceAlias({
			auth: context.auth,
			indexName: p.indexName,
			aliasName: p.aliasName,
			targetNamespace: p.targetNamespace,
		});
	},
});
