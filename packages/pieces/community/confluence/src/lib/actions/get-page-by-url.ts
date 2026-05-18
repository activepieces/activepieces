import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { confluenceAuth } from '../auth';
import { confluenceApiCall, parsePageIdFromUrl } from '../common';

export const getPageByUrlAction = createAction({
	auth: confluenceAuth,
	name: 'get-page-by-url',
	displayName: 'Get Page by URL',
	description:
		'Fetches a page by its Confluence web URL (extracts the page ID automatically).',
	props: {
		url: Property.ShortText({
			displayName: 'Page URL',
			description:
				'Paste any Confluence page URL, e.g. https://your-domain.atlassian.net/wiki/spaces/DOCS/pages/12345/My+Page',
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
					{ label: 'View (HTML)', value: 'view' },
					{ label: 'Atlas Document Format', value: 'atlas_doc_format' },
					{ label: 'None', value: '' },
				],
			},
		}),
	},
	async run(context) {
		const { url, bodyFormat } = context.propsValue;
		const pageId = parsePageIdFromUrl(url);

		if (!pageId) {
			throw new Error(`Could not extract a page ID from the URL: ${url}`);
		}

		return await confluenceApiCall({
			domain: context.auth.props.confluenceDomain,
			username: context.auth.props.username,
			password: context.auth.props.password,
			method: HttpMethod.GET,
			version: 'v2',
			resourceUri: `/pages/${pageId}`,
			query: bodyFormat ? { 'body-format': bodyFormat } : undefined,
		});
	},
});
