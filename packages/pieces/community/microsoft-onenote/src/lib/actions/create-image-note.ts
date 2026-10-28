import { Property, createAction } from '@activepieces/pieces-framework';
import { microsoftOneNoteAuth } from '../auth';
import { microsoftOneNoteClient } from '../common/client';
import { microsoftOneNoteProps } from '../common/props';
import type { OnenotePage } from '../common/types';
import { createImageNoteOutputSchema } from '../output-schemas';

export const createImageNoteAction = createAction({
	auth: microsoftOneNoteAuth,
	name: 'create_image_note',
	outputSchema: createImageNoteOutputSchema,
	classification: 'WRITE',
	displayName: 'Create Image Note',
	description: 'Create a note containing an embedded image via a public image URL.',
	audience: 'human',
	aiMetadata: { description: 'Creates a new OneNote page in a section with an embedded image referenced by a publicly accessible image URL, plus an optional title and description. Choose this over Create Page when the note is primarily an image; the image URL must be reachable by Microsoft Graph. Not idempotent: each call creates a new page.', idempotent: false },
	props: {
		notebook_id: microsoftOneNoteProps.notebookId({
			required: true,
			description: 'The notebook to create the image note in.',
		}),
		section_id: microsoftOneNoteProps.sectionId({
			required: true,
			description: 'The section to create the image note in.',
		}),
		title: Property.ShortText({
			displayName: 'Page Title',
			description: 'The title of the image note page.',
			required: true,
		}),
		image_url: Property.ShortText({
			displayName: 'Image URL',
			description: 'The public URL of the image to embed (must be publicly accessible).',
			required: true,
		}),
		image_width: Property.Number({
			displayName: 'Image Width',
			description: 'The width of the image in pixels (optional).',
			required: false,
			defaultValue: 300,
		}),
		image_alt_text: Property.ShortText({
			displayName: 'Image Alt Text',
			description: 'Alternative text for the image (for accessibility).',
			required: false,
			defaultValue: 'Embedded image',
		}),
		description: Property.LongText({
			displayName: 'Description',
			description: 'Optional description text to include with the image.',
			required: false,
		}),
	},
	async run(context) {
		const { auth, propsValue } = context;
		const { section_id, title, image_url, image_width, image_alt_text, description } = propsValue;

		const client = microsoftOneNoteClient.create({ auth });

		const imageTag = image_width
			? `<img src="${image_url}" alt="${image_alt_text || 'Embedded image'}" width="${image_width}" />`
			: `<img src="${image_url}" alt="${image_alt_text || 'Embedded image'}" />`;

		const htmlContent = `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
	<title>${title}</title>
</head>
<body>
	<h1>${title}</h1>
	${description ? `<p>${description}</p>` : ''}
	${imageTag}
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
				imageUrl: image_url,
				imageWidth: image_width,
				imageAltText: image_alt_text,
				links: response.links,
				self: response.self,
			};
		} catch (error) {
			throw new Error(`Failed to create image note: ${(error instanceof Error && error.message) || 'Unknown error'}`);
		}
	},
});
