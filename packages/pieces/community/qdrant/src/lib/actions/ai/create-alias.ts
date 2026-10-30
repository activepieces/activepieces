import { createAction, Property } from '@activepieces/pieces-framework';

import { qdrantAuth } from '../../auth';
import { qdrantAiProps } from '../../common/ai-props';
import { qdrantApi } from '../../common/api';
import { qdrantSuccessOutputSchema } from '../../output-schemas';

export const createAliasAction = createAction({
	auth: qdrantAuth,
	name: 'qdrant_create_alias',
	outputSchema: qdrantSuccessOutputSchema,
	displayName: 'Create Alias',
	description: 'Creates an alias for a collection.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Point an alias at a collection, so readers can use a stable name while the collection behind it changes. If the alias already exists it is moved to this collection, so repeating the call converges on the same state.',
		idempotent: true,
	},
	props: {
		collectionName: qdrantAiProps.collectionName({
			required: true,
			description: 'Collection the alias points to. Use List Collections to find it.',
		}),
		aliasName: Property.ShortText({
			displayName: 'Alias Name',
			description: 'New alias name, e.g. "products-live".',
			required: true,
		}),
	},
	run: async ({ auth, propsValue }) => {
		const created = await qdrantApi.updateAliases({
			auth,
			actions: [
				{
					create_alias: {
						collection_name: propsValue.collectionName,
						alias_name: propsValue.aliasName,
					},
				},
			],
		});
		return { success: created };
	},
});
