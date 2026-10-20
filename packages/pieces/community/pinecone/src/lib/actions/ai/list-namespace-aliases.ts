import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeAiProps } from '../../common/ai-props';
import { pineconeApi } from '../../common/api';
import { pineconeListNamespaceAliasesOutputSchema } from '../../output-schemas';

export const pineconeListNamespaceAliasesAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_list_namespace_aliases',
	outputSchema: pineconeListNamespaceAliasesOutputSchema,
	displayName: 'List Namespace Aliases',
	description: 'Lists the namespace aliases of an index.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the namespace aliases of an index and the namespace each points to, one page at a time, optionally filtered by name prefix or target namespace. Pass the returned pagination token with the same filters for the next page.',
		idempotent: true,
	},
	props: {
		indexName: pineconeAiProps.indexName({ required: true }),
		prefix: Property.ShortText({
			displayName: 'Name Prefix',
			description: 'Only list aliases whose name starts with this text.',
			required: false,
		}),
		targetNamespace: Property.ShortText({
			displayName: 'Target Namespace',
			description: 'Only list aliases that point to this namespace.',
			required: false,
		}),
		limit: pineconeAiProps.limit({
			required: false,
			description: 'Maximum number of items to return, 1-100. Defaults to 100.',
		}),
		paginationToken: pineconeAiProps.paginationToken({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await pineconeApi.listNamespaceAliases({
			auth: context.auth,
			indexName: p.indexName,
			limit: p.limit,
			paginationToken: p.paginationToken,
			prefix: p.prefix,
			targetNamespace: p.targetNamespace,
		});
	},
});
