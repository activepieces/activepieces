import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioCreateNoteOutputSchema } from '../../output-schemas';

export const attioUpdateNoteAction = createAction({
	auth: attioAuth,
	name: 'attio_update_note',
	outputSchema: attioCreateNoteOutputSchema,
	displayName: 'Update Note',
	description: 'Updates the title or content of a note.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Updates only the supplied fields of a note. Content replaces the existing body.',
		idempotent: true,
	},
	props: {
		note_id: Property.ShortText({ displayName: 'Note ID', description: 'From List Notes or Create Note.', required: true }),
		title: Property.ShortText({ displayName: 'Title', required: false }),
		content: Property.LongText({ displayName: 'Content', description: 'Replaces the whole note body.', required: false }),
		format: Property.StaticDropdown({
			displayName: 'Format',
			description: 'Format of Content. Defaults to plain text.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Plain text', value: 'plaintext' },
					{ label: 'Markdown', value: 'markdown' },
				],
			},
		}),
	},
	async run(context) {
		const { note_id, title, content, format } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.PATCH,
			resourceUri: `/notes/${note_id}`,
			body: { data: attioAi.compact({ title, content, format: content ? (format ?? 'plaintext') : undefined }) },
		});
		return response.data;
	},
});
