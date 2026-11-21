import { createAction } from '@activepieces/pieces-framework';
import { placidAuth } from '../auth';
import { PlacidClient } from '../common/client';
import { placidSchemas } from '../common/output-schemas';
import { renderIdText } from '../common/props';

export const deleteVideoAi = createAction({
	auth: placidAuth,
	name: 'delete_video_ai',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Video (AI)',
	description: 'Permanently delete a generated Video by ID.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Permanently deletes a generated Placid Video render and its file by ID. Irreversible. Deleting an already-deleted ID also succeeds.',
		idempotent: true,
	},
	outputSchema: placidSchemas.deleted,
	props: { video_id: renderIdText('Video') },
	async run({ auth, propsValue }) {
		return new PlacidClient(auth).deleteRender({ id: propsValue.video_id.trim(), type: 'video' });
	},
});
