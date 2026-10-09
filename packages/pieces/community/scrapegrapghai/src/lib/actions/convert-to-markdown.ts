import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapegraphaiAuth } from '../auth';
import { scrapegraphaiApi } from '../common/api';

export const markdownifyAction = createAction({
	name: 'markdownify',
	classification: 'READ',
	displayName: 'Convert to Markdown',
	description: 'Convert any webpage into clean, readable Markdown format.',
	audience: 'both',
	aiMetadata: {
		description:
			'Fetches a webpage by URL and returns its content as clean, readable Markdown. Choose this when you need the whole page as text for an LLM or document rather than a targeted extraction — use Smart Scraper instead when you want specific fields described by a prompt. Requires a public URL; read-only and safe to retry.',
		idempotent: true,
	},
	auth: scrapegraphaiAuth,
	props: {
		website_url: Property.ShortText({
			displayName: 'Website URL',
			description: 'The webpage URL to convert to Markdown',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		return await scrapegraphaiApi.markdownify({
			auth,
			websiteUrl: propsValue.website_url,
		});
	},
});
