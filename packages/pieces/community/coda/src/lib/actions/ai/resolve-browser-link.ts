import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../../auth';
import { codaApi } from '../../common/client';
import { resolveBrowserLinkActionOutputSchema } from '../../output-schemas';

export const resolveBrowserLinkAction = createAction({
	auth: codaAuth,
	name: 'resolve_browser_link',
	classification: 'READ',
	displayName: 'Resolve Coda Link',
	description: 'Finds the doc, page, table or row a Coda link points to and returns its IDs.',
	audience: 'ai',
	aiMetadata: {
		description: 'Turns a Coda / Superhuman Docs URL into the object it points to (doc, page, table, row, column…) with its ID and the doc and table IDs. Use first whenever the user gives a link instead of IDs. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		url: Property.ShortText({
			displayName: 'Link',
			description: 'A coda.io or docs.superhuman.com link copied from the browser.',
			required: true,
		}),
	},
	outputSchema: resolveBrowserLinkActionOutputSchema,
	async run(context) {
		const url = context.propsValue.url.trim();
		if (!/^https:\/\/([a-z0-9-]+\.)*(coda\.io|docs\.superhuman\.com)\//i.test(url)) {
			throw new Error('Link must be a https://coda.io or https://docs.superhuman.com URL.');
		}
		const response = await codaApi.request<ResolvedLink>({
			token: context.auth.secret_text,
			method: HttpMethod.GET,
			path: '/resolveBrowserLink',
			operation: 'resolve link',
			query: { url, degradeGracefully: true },
		});
		const resource = response.resource ?? {};
		const ids = idsFromApiHref(resource.href);
		return {
			resourceType: resource.type ?? null,
			id: resource.id ?? null,
			name: resource.name ?? null,
			docId: ids.docId,
			tableId: ids.tableId,
			browserLink: response.browserLink ?? url,
		};
	},
});

function idsFromApiHref(href: string | undefined): { docId: string | null; tableId: string | null } {
	const match = href ? /\/docs\/([^/?#]+)(?:\/tables\/([^/?#]+))?/.exec(href) : null;
	return {
		docId: match?.[1] ? decodeURIComponent(match[1]) : null,
		tableId: match?.[2] ? decodeURIComponent(match[2]) : null,
	};
}

type ResolvedLink = {
	browserLink?: string;
	resource?: {
		type?: string;
		id?: string;
		name?: string;
		href?: string;
	};
};
