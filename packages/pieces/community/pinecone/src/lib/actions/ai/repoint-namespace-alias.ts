import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeAiProps } from '../../common/ai-props';
import { pineconeApi } from '../../common/api';
import { pineconeCreateNamespaceAliasOutputSchema } from '../../output-schemas';

export const pineconeRepointNamespaceAliasAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_repoint_namespace_alias',
	outputSchema: pineconeCreateNamespaceAliasOutputSchema,
	displayName: 'Repoint Namespace Alias',
	description: 'Points an existing alias at a different namespace.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Points an existing namespace alias at a different target namespace; callers using the alias switch over at once.',
		idempotent: true,
	},
	props: {
		indexName: pineconeAiProps.indexName({ required: true }),
		aliasName: Property.ShortText({
			displayName: 'Alias Name',
			description: 'Namespace alias name, from List Namespace Aliases.',
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
		return await pineconeApi.repointNamespaceAlias({
			auth: context.auth,
			indexName: p.indexName,
			aliasName: p.aliasName,
			targetNamespace: p.targetNamespace,
		});
	},
});
