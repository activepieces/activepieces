import { createAction } from '@activepieces/pieces-framework';

import { qdrantAuth } from '../../auth';
import { qdrantAiProps } from '../../common/ai-props';
import { qdrantApi } from '../../common/api';
import { qdrantSuccessOutputSchema } from '../../output-schemas';

export const deleteCollectionAction = createAction({
	auth: qdrantAuth,
	name: 'qdrant_delete_collection',
	outputSchema: qdrantSuccessOutputSchema,
	displayName: 'Delete Collection',
	description: 'Deletes a collection and all of its points.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently delete a collection and every point in it. Cannot be undone; run Create Snapshot first to keep a backup.',
		idempotent: false,
	},
	props: {
		collectionName: qdrantAiProps.collectionName({ required: true }),
	},
	run: async ({ auth, propsValue }) => {
		const deleted = await qdrantApi.deleteCollection({
			auth,
			collectionName: propsValue.collectionName,
		});
		return { success: deleted };
	},
});
