import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { confluenceAuth } from '../auth';
import { confluenceApiCall } from '../common';
import { pageIdProp, spaceIdProp } from '../common/props';

type CurrentPage = {
	id: string;
	status: string;
	title: string;
	spaceId: string;
	version: { number: number };
	body?: { storage?: { value: string; representation: string } };
};

export const updatePageAction = createAction({
	auth: confluenceAuth,
	name: 'update-page',
	displayName: 'Update Page',
	description: 'Updates the title, body, or status of an existing page.',
	props: {
		spaceId: spaceIdProp,
		pageId: pageIdProp,
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

		const current = await confluenceApiCall<CurrentPage>({
			domain: context.auth.props.confluenceDomain,
			username: context.auth.props.username,
			password: context.auth.props.password,
			method: HttpMethod.GET,
			version: 'v2',
			resourceUri: `/pages/${pageId}`,
			query: { 'body-format': 'storage' },
		});

		return await confluenceApiCall({
			domain: context.auth.props.confluenceDomain,
			username: context.auth.props.username,
			password: context.auth.props.password,
			method: HttpMethod.PUT,
			version: 'v2',
			resourceUri: `/pages/${pageId}`,
			body: {
				id: pageId,
				status: status ?? current.status,
				title: title ?? current.title,
				body: {
					representation: bodyFormat,
					value: body ?? current.body?.storage?.value ?? '',
				},
				version: {
					number: current.version.number + 1,
				},
			},
		});
	},
});
