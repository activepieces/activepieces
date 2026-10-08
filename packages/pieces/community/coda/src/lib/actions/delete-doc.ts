import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../auth';
import { codaApi } from '../common/client';
import { codaProps } from '../common/ai-props';
import { deleteDocActionOutputSchema } from '../output-schemas';

export const deleteDocAction = createAction({
	auth: codaAuth,
	name: 'delete_doc',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Doc',
	description: 'Permanently deletes a doc. This cannot be undone through the API.',
	audience: 'both',
	aiMetadata: {
		description: 'Permanently deletes a whole Coda doc with all its pages and tables. Use only when the user explicitly asks to delete the doc. A repeat call finds it gone and reports Already Deleted instead of failing, so it is idempotent.',
		idempotent: true,
	},
	props: {
		docId: codaProps.docId(),
	},
	outputSchema: deleteDocActionOutputSchema,
	async run(context) {
		const id = codaApi.parseDocId(context.propsValue.docId);
		try {
			await codaApi.request({
				token: context.auth.secret_text,
				method: HttpMethod.DELETE,
				path: codaApi.docPath(id),
				operation: 'delete doc',
			});
			return { id, deleted: true, alreadyDeleted: false };
		} catch (error) {
			if (codaApi.statusOf(error) === 404) {
				return { id, deleted: true, alreadyDeleted: true };
			}
			throw error;
		}
	},
});
