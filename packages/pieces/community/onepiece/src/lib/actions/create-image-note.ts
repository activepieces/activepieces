import { Property, createAction, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { getSectionsDropdown } from '../common';
import { oneNoteAuth } from '../../index';
import { Client } from '@microsoft/microsoft-graph-client';

export const createImageNote = createAction({
	auth: oneNoteAuth,
	name: 'create_image_note',
	displayName: 'Create Image Note',
	description: 'Create a OneNote page containing an embedded image from a public URL.',
	props: {
		section_id: Property.Dropdown({
			displayName: 'Section',
			description: 'The section to create the image note in.',
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
				return await getSectionsDropdown(auth as OAuth2PropertyValue);
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

		// Build the image tag with optional width
		const imageTag = image_width 
			? `<img src="${image_url}" alt="${image_alt_text || 'Embedded image'}" width="${image_width}" />`
			: `<img src="${image_url}" alt="${image_alt_text || 'Embedded image'}" />`;

		// Create the HTML structure for OneNote page with embedded image
		const htmlContent = `
			<!DOCTYPE html>
			<html>
			<head>
				<title>${title}</title>
			</head>
			<body>
				<h1>${title}</h1>
				${description ? `<p>${description}</p>` : ''}
				${imageTag}
			</body>
			</html>
		`;

		const response = await client
			.api(`/me/onenote/sections/${section_id}/pages`)
			.header('Content-Type', 'text/html')
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
	},
});
