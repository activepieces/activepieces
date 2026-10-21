import { createAction, Property } from '@activepieces/pieces-framework';
import { confluenceAuth } from '../auth';
import { confluenceApi } from '../common/api';
import { getPageByUrlOutputSchema } from '../output-schemas';

export const getPageByUrlAction = createAction({
	auth: confluenceAuth,
	name: 'get-page-by-url',
	outputSchema: getPageByUrlOutputSchema,
	classification: 'READ',
	displayName: 'Get Page by URL',
	description:
		'Fetches a page by its Confluence web URL (extracts the page ID automatically).',
	audience: 'both',
	aiMetadata: { description: 'Fetches a single Confluence page when you have its web URL rather than its numeric ID, parsing the page ID out of the URL automatically. Use instead of Get Page Content when the agent only has a copy-pasted page link. The body representation (storage, view, atlas doc, or none) is selectable. Read-only and idempotent.', idempotent: true },
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

		return await confluenceApi.getPage({ auth: context.auth, pageId, bodyFormat });
	},
});

function parsePageIdFromUrl(url: string): string | null {
	const pageIdFromPath = url.match(/\/pages\/(\d+)/);
	if (pageIdFromPath) return pageIdFromPath[1];
	const pageIdFromQuery = url.match(/[?&]pageId=(\d+)/);
	if (pageIdFromQuery) return pageIdFromQuery[1];
	return null;
}
