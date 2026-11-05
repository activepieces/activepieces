import { Property, createAction } from '@activepieces/pieces-framework';
import { microsoftOneNoteAuth } from '../auth';
import { microsoftOneNoteClient } from '../common/client';
import { microsoftOneNoteProps } from '../common/props';
import { appendNoteOutputSchema } from '../output-schemas';

export const appendNoteAction = createAction({
	auth: microsoftOneNoteAuth,
	name: 'append_note',
	outputSchema: appendNoteOutputSchema,
	classification: 'WRITE',
	displayName: 'Append Note',
	description: 'Append content to the end of an existing note.',
	audience: 'human',
	aiMetadata: { description: 'Appends content to the body of an existing OneNote page (note), identified by notebook, section, and page. Use to add to a note rather than replace it; the content type can be a paragraph, list item, heading, or raw HTML. Not idempotent: each call appends again, so repeating duplicates the content.', idempotent: false },
	props: {
		notebook_id: microsoftOneNoteProps.notebookId({
			required: true,
			description: 'The notebook containing the page to append to.',
		}),
		section_id: microsoftOneNoteProps.sectionId({
			required: true,
			description: 'The section containing the page to append to.',
		}),
		page_id: microsoftOneNoteProps.pageId({
			required: true,
			description: 'The page to append content to.',
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

		const client = microsoftOneNoteClient.create({ auth });

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
		} catch (error) {
			throw new Error(`Failed to append content: ${(error instanceof Error && error.message) || 'Unknown error'}`);
		}
	},
});
