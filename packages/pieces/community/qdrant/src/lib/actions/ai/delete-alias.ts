import { createAction, Property } from '@activepieces/pieces-framework';

import { qdrantAuth } from '../../auth';
import { qdrantApi } from '../../common/api';
import { qdrantSuccessOutputSchema } from '../../output-schemas';

export const deleteAliasAction = createAction({
	auth: qdrantAuth,
	name: 'qdrant_delete_alias',
	outputSchema: qdrantSuccessOutputSchema,
	displayName: 'Delete Alias',
	description: 'Deletes an alias.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Delete an alias. The collection it pointed to and its points are not affected.',
		idempotent: false,
	},
	props: {
		aliasName: Property.ShortText({
			displayName: 'Alias Name',
			description: 'Alias to delete. Use List Aliases to find it.',
			required: true,
		}),
	},
	run: async ({ auth, propsValue }) => {
		const deleted = await qdrantApi.updateAliases({
			auth,
			actions: [{ delete_alias: { alias_name: propsValue.aliasName } }],
		});
		return { success: deleted };
	},
});
