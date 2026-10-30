import { createAction, Property } from '@activepieces/pieces-framework';

import { qdrantAuth } from '../../auth';
import { qdrantAiProps } from '../../common/ai-props';
import { qdrantApi } from '../../common/api';
import { qdrantSuccessOutputSchema } from '../../output-schemas';

export const deleteSnapshotAction = createAction({
	auth: qdrantAuth,
	name: 'qdrant_delete_snapshot',
	outputSchema: qdrantSuccessOutputSchema,
	displayName: 'Delete Snapshot',
	description: 'Deletes a snapshot of a collection.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently delete one snapshot file of a collection. The collection itself is not affected.',
		idempotent: false,
	},
	props: {
		collectionName: qdrantAiProps.collectionName({ required: true }),
		snapshotName: Property.ShortText({
			displayName: 'Snapshot Name',
			description:
				'Snapshot file name, e.g. "products-2026-10-24-10-00-00.snapshot". Use List Snapshots to find it.',
			required: true,
		}),
	},
	run: async ({ auth, propsValue }) => {
		const deleted = await qdrantApi.deleteSnapshot({
			auth,
			collectionName: propsValue.collectionName,
			snapshotName: propsValue.snapshotName,
		});
		return { success: deleted };
	},
});
