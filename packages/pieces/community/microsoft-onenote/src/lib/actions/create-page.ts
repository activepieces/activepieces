import { Property, createAction } from '@activepieces/pieces-framework';
import { microsoftOneNoteAuth } from '../auth';
import { microsoftOneNoteClient } from '../common/client';
import { microsoftOneNoteProps } from '../common/props';
import type { OnenotePage } from '../common/types';
import { createNoteInSectionOutputSchema } from '../output-schemas';

export const createPageAction = createAction({
	auth: microsoftOneNoteAuth,
	name: 'create_page',
	outputSchema: createNoteInSectionOutputSchema,
	classification: 'WRITE',
	displayName: 'Create Page',
	description: 'Creates a page in section.',
	audience: 'human',
	aiMetadata: { description: 'Creates a new OneNote page in a chosen notebook section with a title and optional HTML body content. Functionally similar to Create Note in Section; pick either to add a text page. Content accepts basic HTML tags. Not idempotent: each call creates a new page.', idempotent: false },
	props: {
		notebook_id: microsoftOneNoteProps.notebookId({
			required: true,
			description: 'The notebook to create the page in.',
		}),
		section_id: microsoftOneNoteProps.sectionId({
			required: true,
			description: 'The section to create the page in.',
		}),
		title: Property.ShortText({
			displayName: 'Page Title',
			description: 'The title of the page.',
			required: true,
		}),
		content: Property.LongText({
			displayName: 'Page Content',
			description: 'The HTML content of the page. Use basic HTML tags like <p>, <h1>, <h2>, <ul>, <li>, etc.',
			required: false,
			defaultValue: '<p>Your page content here...</p>',
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
	${content || '<p>New page created via Activepieces</p>'}
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
			throw new Error(`Failed to create page: ${(error instanceof Error && error.message) || 'Unknown error'}`);
		}
	},
});
