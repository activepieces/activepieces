import { createAction, Property } from '@activepieces/pieces-framework';
import { confluenceAuth } from '../auth';
import { confluenceApi } from '../common/api';
import { confluenceProps } from '../common/props';
import { updatePageOutputSchema } from '../output-schemas';

export const updatePageAction = createAction({
	auth: confluenceAuth,
	name: 'update-page',
	outputSchema: updatePageOutputSchema,
	classification: 'WRITE',
	displayName: 'Update Page',
	description: 'Updates the title, body, or status of an existing page.',
	audience: 'human',
	aiMetadata: { description: 'Updates an existing Confluence page identified by page ID, changing its title, body, and/or status; blank title or body fields keep the current values. Reads the current version first and bumps the version number on save. Use to edit a known page. Not strictly idempotent: each call increments the page version even when content is unchanged.', idempotent: false },
	props: {
		spaceId: confluenceProps.spaceId({ required: true }),
		pageId: confluenceProps.pageId({ required: true }),
		title: Property.ShortText({
			displayName: 'Title',
			description: 'Leave blank to keep the current title.',
			required: false,
		}),
		bodyFormat: Property.StaticDropdown({
			displayName: 'Body Format',
			required: true,
			defaultValue: 'storage',
			options: {
				disabled: false,
				options: [
					{ label: 'Storage (XHTML)', value: 'storage' },
					{ label: 'Wiki Markup', value: 'wiki' },
					{ label: 'Atlas Document Format', value: 'atlas_doc_format' },
				],
			},
		}),
		body: Property.LongText({
			displayName: 'Body',
			description: 'New page content. Leave blank to keep existing body.',
			required: false,
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Published', value: 'current' },
					{ label: 'Draft', value: 'draft' },
				],
			},
		}),
	},
	async run(context) {
		const { pageId, title, bodyFormat, body, status } = context.propsValue;

		const current = await confluenceApi.getPage({
			auth: context.auth,
			pageId,
			bodyFormat: 'storage',
		});

		return await confluenceApi.updatePage({
			auth: context.auth,
			pageId,
			status: status ?? current.status,
			title: title ?? current.title,
			representation: bodyFormat,
			value: body ?? current.body?.storage?.value ?? '',
			versionNumber: current.version.number + 1,
		});
	},
});
