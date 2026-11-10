import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioDeleteNoteOutputSchema } from '../../output-schemas';

export const attioDeleteNoteAction = createAction({
	auth: attioAuth,
	name: 'attio_delete_note',
	outputSchema: attioDeleteNoteOutputSchema,
	displayName: 'Delete Note',
	description: 'Permanently deletes a note.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes a note by ID. Cannot be undone.',
		idempotent: false,
	},
	props: {
		note_id: Property.ShortText({ displayName: 'Note ID', description: 'From List Notes or Create Note.', required: true }),
	},
	async run(context) {
		const { note_id } = context.propsValue;
		await attioApiCall({
			accessToken: context.auth.secret_text,
			method: HttpMethod.DELETE,
			resourceUri: `/notes/${note_id}`,
		});
		return { success: true, note_id };
	},
});
