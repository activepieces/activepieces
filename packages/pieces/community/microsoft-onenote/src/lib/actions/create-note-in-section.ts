import { Property, createAction } from '@activepieces/pieces-framework';
import { microsoftOneNoteAuth } from '../auth';
import { microsoftOneNoteClient } from '../common/client';
import { microsoftOneNoteProps } from '../common/props';
import type { OnenotePage } from '../common/types';
import { createNoteInSectionOutputSchema } from '../output-schemas';

export const createNoteInSectionAction = createAction({
	auth: microsoftOneNoteAuth,
	name: 'create_note_in_section',
	outputSchema: createNoteInSectionOutputSchema,
	classification: 'WRITE',
	displayName: 'Create Note in Section',
	description: 'Create a new note in a specific section with title and content.',
	audience: 'human',
	aiMetadata: { description: 'Creates a new OneNote page (note) in a chosen notebook section with a title and optional HTML body content. Use when adding a fresh note; content accepts basic HTML tags. Not idempotent: each call creates a new page even with identical input.', idempotent: false },
	props: {
		notebook_id: microsoftOneNoteProps.notebookId({
			required: true,
			description: 'The notebook to create the note in.',
		}),
		section_id: microsoftOneNoteProps.sectionId({
			required: true,
			description: 'The section to create the note in.',
		}),
		title: Property.ShortText({
			displayName: 'Note Title',
			description: 'The title of the note.',
			required: true,
		}),
		content: Property.LongText({
			displayName: 'Note Content',
			description: 'The content of the note. Use basic HTML tags like <p>, <h1>, <h2>, <ul>, <li>, etc.',
			required: false,
			defaultValue: '<p>Your note content here...</p>',
		}),
	},
	async run(context) {
		const { auth, propsValue } = context;
		const { section_id, title, content } = propsValue;

		const client = microsoftOneNoteClient.create({ auth });

		const htmlContent = `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
	<title>${title}</title>
</head>
<body>
	<h1>${title}</h1>
	${content || '<p>New note created via Activepieces</p>'}
</body>
</html>`;

		try {
			const response: OnenotePage = await client
				.api(`/me/onenote/sections/${section_id}/pages`)
				.header('Content-Type', 'application/xhtml+xml')
				.post(htmlContent);

			return {
				id: response.id,
				title: response.title,
				createdDateTime: response.createdDateTime,
				lastModifiedDateTime: response.lastModifiedDateTime,
				contentUrl: response.contentUrl,
				createdByAppId: response.createdByAppId,
				level: response.level,
				order: response.order,
				links: response.links,
				self: response.self,
			};
		} catch (error) {
			throw new Error(`Failed to create note: ${(error instanceof Error && error.message) || 'Unknown error'}`);
		}
	},
});
