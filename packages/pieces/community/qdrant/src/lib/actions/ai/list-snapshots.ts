import { createAction } from '@activepieces/pieces-framework';

import { qdrantAuth } from '../../auth';
import { qdrantAiProps } from '../../common/ai-props';
import { qdrantApi } from '../../common/api';
import { qdrantListSnapshotsOutputSchema } from '../../output-schemas';

export const listSnapshotsAction = createAction({
	auth: qdrantAuth,
	name: 'qdrant_list_snapshots',
	outputSchema: qdrantListSnapshotsOutputSchema,
	displayName: 'List Snapshots',
	description: 'Lists the snapshots of a collection.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: "List a collection's snapshots with their name, creation time and size.",
		idempotent: true,
	},
	props: {
		collectionName: qdrantAiProps.collectionName({ required: true }),
	},
	run: async ({ auth, propsValue }) => {
		const snapshots = await qdrantApi.listSnapshots({
			auth,
			collectionName: propsValue.collectionName,
		});
		return { snapshots, count: snapshots.length };
	},
});
