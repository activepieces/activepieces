import { createAction } from '@activepieces/pieces-framework';
import { placidAuth } from '../auth';
import { PlacidClient } from '../common/client';
import { placidSchemas } from '../common/output-schemas';
import { renderIdText } from '../common/props';

export const deleteImageAi = createAction({
	auth: placidAuth,
	name: 'delete_image_ai',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Image (AI)',
	description: 'Permanently delete a generated Image by ID.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Permanently deletes a generated Placid Image render and its file by ID. Irreversible. Deleting an already-deleted ID also succeeds.',
		idempotent: true,
	},
	outputSchema: placidSchemas.deleted,
	props: { image_id: renderIdText('Image') },
	async run({ auth, propsValue }) {
		return new PlacidClient(auth).deleteRender({ id: propsValue.image_id.trim(), type: 'image' });
	},
});
