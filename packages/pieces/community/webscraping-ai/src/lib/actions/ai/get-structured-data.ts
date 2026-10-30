import { createAction, Property } from '@activepieces/pieces-framework';

import { webscrapingAiAuth } from '../../auth';
import { webscrapingAiApi } from '../../common/api';
import { siteDataOutputSchema } from '../../output-schemas';

export const getStructuredDataAction = createAction({
	auth: webscrapingAiAuth,
	name: 'webscraping_ai_get_structured_data',
	outputSchema: siteDataOutputSchema,
	displayName: 'Get Structured Data for a Page',
	description:
		'Returns parsed structured data for a page on a supported site such as YouTube, Instagram, LinkedIn or Reddit.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns parsed structured data (title, author, counts, comments and similar) for a page on a supported site such as a YouTube video, an Instagram post or profile, a LinkedIn profile, company or job, or a Reddit post. Check parse_status: an unsupported or missing page still returns 200. Reddit pages cost 50 credits. Read-only on the target site.',
		idempotent: true,
	},
	props: {
		url: Property.ShortText({
			displayName: 'URL',
			description:
				'URL of a page on a supported site, e.g. "https://www.youtube.com/watch?v=dQw4w9WgXcQ".',
			required: true,
		}),
		country: Property.ShortText({
			displayName: 'Proxy Country',
			description:
				'Two-letter country code of the proxy used to fetch the page, one of the proxy countries (us, gb, de, it, fr, ca, es, ru, jp, kr, in, hk, tr). Defaults to "us".',
			required: false,
		}),
		transcript: Property.Checkbox({
			displayName: 'Include Transcript',
			description:
				'YouTube videos only. Also fetch the video transcript into data.transcript. Defaults to false.',
			required: false,
		}),
		transcriptLanguage: Property.ShortText({
			displayName: 'Transcript Language',
			description:
				'YouTube videos only, with Include Transcript. Caption language, e.g. "en" or "de".',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await webscrapingAiApi.getSiteData({ auth, ...propsValue });
	},
});
