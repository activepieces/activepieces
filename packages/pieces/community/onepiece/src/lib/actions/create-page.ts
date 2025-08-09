import { Property, createAction, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { oneNoteAuth } from '../../index';
import { Client } from '@microsoft/microsoft-graph-client';

export const createPage = createAction({
	auth: oneNoteAuth,
	name: 'create_page',
	displayName: 'Create Page',
	description: 'Creates a page in the default notebook. Optionally specify a section name.',
	props: {
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
		section_name: Property.ShortText({
			displayName: 'Section Name',
			description: 'Optional: Name of the section to create the page in. If the section doesn\'t exist, it will be created.',
			required: false,
		}),
	},
	async run(context) {
		const { auth, propsValue } = context;
		const { title, content, section_name } = propsValue;

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve((auth as OAuth2PropertyValue).access_token),
			},
		});

		// Create the HTML structure for OneNote page
		const htmlContent = `
			<!DOCTYPE html>
			<html>
			<head>
				<title>${title}</title>
			</head>
			<body>
				<h1>${title}</h1>
				${content || '<p>New page created via Activepieces</p>'}
			</body>
			</html>
		`;

		// Build API endpoint with optional section name query parameter
		let apiEndpoint = '/me/onenote/pages';
		if (section_name) {
			apiEndpoint += `?sectionName=${encodeURIComponent(section_name)}`;
		}

		const response = await client
			.api(apiEndpoint)
			.header('Content-Type', 'text/html')
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
			sectionName: section_name || 'Default section',
		};
	},
});
