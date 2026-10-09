import { HttpMethod } from '@activepieces/pieces-common';

import { scrapegraphaiClient } from './client';

import type {
	ScrapegraphaiAuthValue,
	ScrapegraphaiMarkdownifyResult,
	ScrapegraphaiScrapeResult,
} from './types';

async function smartScraper({
	auth,
	websiteUrl,
	userPrompt,
	outputSchema,
}: {
	auth: ScrapegraphaiAuthValue;
	websiteUrl: string;
	userPrompt: string;
	outputSchema?: unknown;
}): Promise<ScrapegraphaiScrapeResult> {
	return await scrapegraphaiClient.request<ScrapegraphaiScrapeResult>({
		auth,
		method: HttpMethod.POST,
		path: '/smartscraper',
		body: {
			website_url: websiteUrl,
			user_prompt: userPrompt,
			output_schema: outputSchema,
		},
	});
}

async function localScraper({
	auth,
	websiteHtml,
	userPrompt,
	outputSchema,
}: {
	auth: ScrapegraphaiAuthValue;
	websiteHtml: string;
	userPrompt: string;
	outputSchema?: unknown;
}): Promise<ScrapegraphaiScrapeResult> {
	return await scrapegraphaiClient.request<ScrapegraphaiScrapeResult>({
		auth,
		method: HttpMethod.POST,
		path: '/localscraper',
		body: {
			website_html: websiteHtml,
			user_prompt: userPrompt,
			output_schema: outputSchema,
		},
	});
}

async function markdownify({
	auth,
	websiteUrl,
}: {
	auth: ScrapegraphaiAuthValue;
	websiteUrl: string;
}): Promise<ScrapegraphaiMarkdownifyResult> {
	return await scrapegraphaiClient.request<ScrapegraphaiMarkdownifyResult>({
		auth,
		method: HttpMethod.POST,
		path: '/markdownify',
		body: {
			website_url: websiteUrl,
		},
	});
}

export const scrapegraphaiApi = { smartScraper, localScraper, markdownify };
