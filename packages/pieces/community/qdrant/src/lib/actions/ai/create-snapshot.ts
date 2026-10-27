import { createAction } from '@activepieces/pieces-framework';

import { qdrantAuth } from '../../auth';
import { qdrantAiProps } from '../../common/ai-props';
import { qdrantApi } from '../../common/api';
import { qdrantCreateSnapshotOutputSchema } from '../../output-schemas';

export const createSnapshotAction = createAction({
	auth: qdrantAuth,
	name: 'qdrant_create_snapshot',
	outputSchema: qdrantCreateSnapshotOutputSchema,
	displayName: 'Create Snapshot',
	description: 'Creates a snapshot of a collection.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Create a snapshot (a full backup file stored on the Qdrant server) of a collection and wait until it is written. Returns the snapshot name that Delete Snapshot takes. Each call creates a new snapshot.',
		idempotent: false,
	},
	props: {
		collectionName: qdrantAiProps.collectionName({ required: true }),
	},
	run: async ({ auth, propsValue }) => {
		return await qdrantApi.createSnapshot({ auth, collectionName: propsValue.collectionName });
	},
});
