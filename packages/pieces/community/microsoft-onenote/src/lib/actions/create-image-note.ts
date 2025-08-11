import { Property, createAction, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { getNotebooksDropdown, getSectionsByNotebookDropdown } from '../common';
import { oneNoteAuth } from '../../index';
import { Client } from '@microsoft/microsoft-graph-client';

export const createImageNote = createAction({
	auth: oneNoteAuth,
	name: 'create_image_note',
	displayName: 'Create Image Note',
	description: 'Create a note containing an embedded image via a public image URL.',
	props: {
		notebook_id: Property.Dropdown({
			displayName: 'Notebook',
			description: 'The notebook to create the image note in.',
			required: true,
			refreshers: [],
			options: async ({ auth }) => {
				if (!(auth as OAuth2PropertyValue)?.access_token) {
					return {
						disabled: true,
						placeholder: 'Connect your account first',
						options: [],
					};
				}
				return await getNotebooksDropdown(auth as OAuth2PropertyValue);
			},
		}),
		section_id: Property.Dropdown({
			displayName: 'Section',
			description: 'The section to create the image note in.',
			required: true,
			refreshers: ['notebook_id'],
			options: async ({ auth, notebook_id }) => {
				if (!(auth as OAuth2PropertyValue)?.access_token) {
					return {
						disabled: true,
						placeholder: 'Connect your account first',
						options: [],
					};
				}
				if (!notebook_id) {
					return {
						disabled: true,
						placeholder: 'Select a notebook first',
						options: [],
					};
				}
				return await getSectionsByNotebookDropdown(auth as OAuth2PropertyValue, notebook_id as string);
			},
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

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve((auth as OAuth2PropertyValue).access_token),
			},
		});

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
			const response = await client
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
		} catch (error: any) {
			throw new Error(`Failed to create image note: ${error.message || 'Unknown error'}`);
		}
	},
});
