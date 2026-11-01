import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioCreateNoteOutputSchema } from '../../output-schemas';

export const attioCreateNoteAction = createAction({
	auth: attioAuth,
	name: 'attio_create_note',
	outputSchema: attioCreateNoteOutputSchema,
	displayName: 'Create Note',
	description: 'Creates a note on a record.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Creates a note on a record, in plain text or markdown, optionally linked to a meeting. Not idempotent: each call adds a new note.',
		idempotent: false,
	},
	props: {
		parent_object: attioAi.objectProp(),
		parent_record_id: attioAi.recordIdProp({ description: 'ID of the record the note belongs to.' }),
		title: Property.ShortText({ displayName: 'Title', required: true }),
		content: Property.LongText({ displayName: 'Content', required: true }),
		format: Property.StaticDropdown({
			displayName: 'Format',
			description: 'Defaults to plain text.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Plain text', value: 'plaintext' },
					{ label: 'Markdown', value: 'markdown' },
				],
			},
		}),
		meeting_id: Property.ShortText({ displayName: 'Meeting ID', description: 'Optional meeting to link, from List Meetings.', required: false }),
	},
	async run(context) {
		const { parent_object, parent_record_id, title, content, format, meeting_id } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: `/notes`,
			body: { data: attioAi.compact({ parent_object, parent_record_id, title, content, format: format ?? 'plaintext', meeting_id }) },
		});
		return response.data;
	},
});
