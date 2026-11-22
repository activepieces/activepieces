import { createAction } from '@activepieces/pieces-framework';
import { placidAuth } from '../auth';
import { PlacidClient } from '../common/client';
import { placidSchemas } from '../common/output-schemas';
import { renderIdText } from '../common/props';

export const deletePdfAi = createAction({
	auth: placidAuth,
	name: 'delete_pdf_ai',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete PDF (AI)',
	description: 'Permanently delete a generated PDF by ID.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Permanently deletes a generated Placid PDF render and its file by ID. Irreversible. Deleting an already-deleted ID also succeeds.',
		idempotent: true,
	},
	outputSchema: placidSchemas.deleted,
	props: { pdf_id: renderIdText('PDF') },
	async run({ auth, propsValue }) {
		return new PlacidClient(auth).deleteRender({ id: propsValue.pdf_id.trim(), type: 'pdf' });
	},
});
