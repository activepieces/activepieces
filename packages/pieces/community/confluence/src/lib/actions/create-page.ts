import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { confluenceAuth } from '../auth';
import { confluenceApiCall } from '../common';
import { parentPageIdProp, spaceIdProp } from '../common/props';

export const createPageAction = createAction({
	auth: confluenceAuth,
	name: 'create-page',
	displayName: 'Create Page',
	description: 'Creates a new page in a space with the given title and body.',
	audience: 'both',
	aiMetadata: { description: 'Creates a new Confluence page in the given space with a title and body, optionally nested under a parent page, and either published (current) or saved as a draft. The body is interpreted in the chosen format (storage XHTML, wiki markup, or atlas doc format). Use to author a brand-new page. Not idempotent: each call creates another page even with identical input.', idempotent: false },
	props: {
		spaceId: spaceIdProp,
		parentId: parentPageIdProp,
		title: Property.ShortText({
			displayName: 'Title',
			required: true,
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
			description: 'Page content in the selected format.',
			required: false,
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			required: true,
			defaultValue: 'current',
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
		const { spaceId, parentId, title, bodyFormat, body, status } = context.propsValue;

		return await confluenceApiCall({
			domain: context.auth.props.confluenceDomain,
			username: context.auth.props.username,
			password: context.auth.props.password,
			method: HttpMethod.POST,
			version: 'v2',
			resourceUri: '/pages',
			body: {
				spaceId,
				parentId: parentId || undefined,
				title,
				status,
				body: {
					representation: bodyFormat,
					value: body ?? '',
				},
			},
		});
	},
});
