import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../auth';
import { attioApiCall } from '../common/client';
import { objectTypeIdDropdown } from '../common/props';

export const createNoteAction = createAction({
	name: 'create_note',
	displayName: 'Create Note',
	description: 'Creates a new note on a record.',
	auth: attioAuth,
	props: {
		parentObject: objectTypeIdDropdown({
			displayName: 'Parent Object',
			description: 'The object type the record belongs to (e.g. person, company).',
			required: true,
		}),
		parentRecordId: Property.ShortText({
			displayName: 'Parent Record ID',
			description: 'The ID of the record to attach this note to.',
			required: true,
		}),
		title: Property.ShortText({
			displayName: 'Title',
			description: 'The plaintext title of the note.',
			required: true,
		}),
		format: Property.StaticDropdown({
			displayName: 'Format',
			description: 'How the note content should be interpreted.',
			required: true,
			defaultValue:'plaintext',
			options: {
				disabled: false,
				options: [
					{ label: 'Plaintext', value: 'plaintext' },
					{ label: 'Markdown', value: 'markdown' },
				],
			},
		}),
		content: Property.LongText({
			displayName: 'Content',
			description: 'The body of the note.',
			required: true,
		}),
	},
	async run(context) {
		const accessToken = context.auth.secret_text;
		const { parentObject, parentRecordId, title, format, content } = context.propsValue;

		const body: Record<string, unknown> = {
			parent_object: parentObject,
			parent_record_id: parentRecordId,
			title,
			format,
			content,
		};

		// https://docs.attio.com/rest-api/endpoint-reference/notes/create-a-note
		const response = await attioApiCall<{ data: Record<string, unknown> }>({
			method: HttpMethod.POST,
			accessToken,
			resourceUri: '/notes',
			body: { data: body },
		});

		return response.data;
	},
});
