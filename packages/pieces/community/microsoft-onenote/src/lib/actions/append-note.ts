import { Property, createAction, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { getNotebooksDropdown, getSectionsByNotebookDropdown, getPagesBySectionDropdown } from '../common';
import { oneNoteAuth } from '../../index';
import { Client } from '@microsoft/microsoft-graph-client';

export const appendNote = createAction({
	auth: oneNoteAuth,
	name: 'append_note',
	displayName: 'Append Note',
	description: 'Append content to the end of an existing note.',
	props: {
		notebook_id: Property.Dropdown({
			displayName: 'Notebook',
			description: 'The notebook containing the page to append to.',
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
			description: 'The section containing the page to append to.',
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
		page_id: Property.Dropdown({
			displayName: 'Page',
			description: 'The page to append content to.',
			required: true,
			refreshers: ['section_id'],
			options: async ({ auth, section_id }) => {
				if (!(auth as OAuth2PropertyValue)?.access_token) {
					return {
						disabled: true,
						placeholder: 'Connect your account first',
						options: [],
					};
				}
				if (!section_id) {
					return {
						disabled: true,
						placeholder: 'Select a section first',
						options: [],
					};
				}
				return await getPagesBySectionDropdown(auth as OAuth2PropertyValue, section_id as string);
			},
		}),
		content_type: Property.StaticDropdown({
			displayName: 'Content Type',
			description: 'The type of content to append.',
			required: true,
			options: {
				options: [
					{ label: 'Paragraph', value: 'paragraph' },
					{ label: 'List Item', value: 'list_item' },
					{ label: 'Heading', value: 'heading' },
					{ label: 'Custom HTML', value: 'html' },
				],
			},
			defaultValue: 'paragraph',
		}),
		content: Property.LongText({
			displayName: 'Content',
			description: 'The content to append to the page.',
			required: true,
		}),
		heading_level: Property.StaticDropdown({
			displayName: 'Heading Level',
			description: 'The heading level (only for heading content type).',
			required: false,
			options: {
				options: [
					{ label: 'H1', value: 'h1' },
					{ label: 'H2', value: 'h2' },
					{ label: 'H3', value: 'h3' },
					{ label: 'H4', value: 'h4' },
					{ label: 'H5', value: 'h5' },
					{ label: 'H6', value: 'h6' },
				],
			},
			defaultValue: 'h2',
		}),
	},
	async run(context) {
		const { auth, propsValue } = context;
		const { page_id, content_type, content, heading_level } = propsValue;

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve((auth as OAuth2PropertyValue).access_token),
			},
		});

		let htmlContent: string;
		
		switch (content_type) {
			case 'paragraph':
				htmlContent = `<p>${content}</p>`;
				break;
			case 'list_item':
				htmlContent = `<ul><li>${content}</li></ul>`;
				break;
			case 'heading': {
				const level = heading_level || 'h2';
				htmlContent = `<${level}>${content}</${level}>`;
				break;
			}
			case 'html':
				htmlContent = content;
				break;
			default:
				htmlContent = `<p>${content}</p>`;
		}

		const updateCommand = [
			{
				target: 'body',
				action: 'append',
				content: htmlContent,
			},
		];

		try {
			await client
				.api(`/me/onenote/pages/${page_id}/content`)
				.patch(updateCommand);

			return {
				success: true,
				message: 'Content successfully appended to the page',
				pageId: page_id,
				contentType: content_type,
				appendedContent: htmlContent,
			};
		} catch (error: any) {
			throw new Error(`Failed to append content: ${error.message || 'Unknown error'}`);
		}
	},
});
