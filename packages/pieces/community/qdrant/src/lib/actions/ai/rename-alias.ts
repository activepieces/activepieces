import { createAction, Property } from '@activepieces/pieces-framework';

import { qdrantAuth } from '../../auth';
import { qdrantApi } from '../../common/api';
import { qdrantSuccessOutputSchema } from '../../output-schemas';

export const renameAliasAction = createAction({
	auth: qdrantAuth,
	name: 'qdrant_rename_alias',
	outputSchema: qdrantSuccessOutputSchema,
	displayName: 'Rename Alias',
	description: 'Renames an alias.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Rename an existing alias. The collection it points to does not change.',
		idempotent: false,
	},
	props: {
		oldAliasName: Property.ShortText({
			displayName: 'Current Alias Name',
			description: 'Alias to rename. Use List Aliases to find it.',
			required: true,
		}),
		newAliasName: Property.ShortText({
			displayName: 'New Alias Name',
			description: 'New name for the alias.',
			required: true,
		}),
	},
	run: async ({ auth, propsValue }) => {
		const renamed = await qdrantApi.updateAliases({
			auth,
			actions: [
				{
					rename_alias: {
						old_alias_name: propsValue.oldAliasName,
						new_alias_name: propsValue.newAliasName,
					},
				},
			],
		});
		return { success: renamed };
	},
});
