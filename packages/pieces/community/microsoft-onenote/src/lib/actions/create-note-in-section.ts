import { Property, createAction, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { getNotebooksDropdown, getSectionsByNotebookDropdown } from '../common';
import { oneNoteAuth } from '../../index';
import { Client } from '@microsoft/microsoft-graph-client';

export const createNoteInSection = createAction({
	auth: oneNoteAuth,
	name: 'create_note_in_section',
	displayName: 'Create Note in Section',
	description: 'Create a new note in a specific notebook and section with title and content.',
	props: {
		notebook_id: Property.Dropdown({
			displayName: 'Notebook',
			description: 'The notebook to create the note in.',
			required: true,
			refreshers: ['section_id'],
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
			description: 'The section to create the note in.',
			required: true,
			refreshers: [],
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
				${content || '<p>New note created via Activepieces</p>'}
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
			level: response.level,
			order: response.order,
			links: response.links,
			self: response.self,
		};
	},
});
