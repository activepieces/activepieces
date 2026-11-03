import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowGetPageOutputSchema } from '../../../output-schemas';

export const updatePageAction = createAction({
	auth: webflowAuth,
	name: 'webflow_update_page',
	outputSchema: webflowGetPageOutputSchema,
	displayName: 'Update Page',
	description: 'Updates the title, slug, SEO or Open Graph settings of a page.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Updates a page's metadata (title, slug, SEO, Open Graph); only the fields given change, and at least one is required. Does not change page content or publish the site. Get the page id from List Pages.",
		idempotent: true,
	},
	props: {
		pageId: webflowAiProps.pageId({ required: true }),
		localeId: Property.ShortText({
			displayName: 'Locale ID',
			description: 'Locale ID to update. Leave empty for the primary locale.',
			required: false,
		}),
		title: Property.ShortText({
			displayName: 'Title',
			description: 'New page title.',
			required: false,
		}),
		slug: Property.ShortText({
			displayName: 'Slug',
			description: 'New page slug. Ignored for the home page, collection template pages and utility pages.',
			required: false,
		}),
		seo: Property.Json({
			displayName: 'SEO',
			description: 'SEO fields as an object, e.g. {"title": "...", "description": "..."}.',
			required: false,
		}),
		openGraph: Property.Json({
			displayName: 'Open Graph',
			description:
				'Open Graph fields as an object, e.g. {"title": "...", "description": "...", "titleCopied": false, "descriptionCopied": false}.',
			required: false,
		}),
	},
	async run(context) {
		const { pageId, localeId, title, slug, seo, openGraph } = context.propsValue;
		const seoGiven = hasKeys({ name: 'seo', value: seo });
		const openGraphGiven = hasKeys({ name: 'openGraph', value: openGraph });
		if (title === undefined && slug === undefined && !seoGiven && !openGraphGiven) {
			throw new Error('Set at least one of title, slug, seo or openGraph.');
		}
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.PUT,
			path: `/v2/pages/${encodeURIComponent(pageId)}`,
			query: {
				...(localeId ? { localeId } : {}),
			},
			body: {
				...(title !== undefined ? { title } : {}),
				...(slug !== undefined ? { slug } : {}),
				...(seoGiven ? { seo } : {}),
				...(openGraphGiven ? { openGraph } : {}),
			},
		});
	},
});

function hasKeys({ name, value }: { name: string; value: unknown }): boolean {
	if (value === undefined || value === null) {
		return false;
	}
	if (typeof value !== 'object' || Array.isArray(value)) {
		throw new Error(`${name} must be a JSON object.`);
	}
	return Object.keys(value).length > 0;
}
