import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioCreateNoteOutputSchema } from '../../output-schemas';

export const attioGetNoteAction = createAction({
	auth: attioAuth,
	name: 'attio_get_note',
	outputSchema: attioCreateNoteOutputSchema,
	displayName: 'Get Note',
	description: 'Gets a note by its ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets one note by ID, with its title and content in plaintext and markdown.',
		idempotent: true,
	},
	props: {
		note_id: Property.ShortText({ displayName: 'Note ID', description: 'From List Notes or Create Note.', required: true }),
	},
	async run(context) {
		const { note_id } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/notes/${note_id}`,
		});
		return response.data;
	},
});
