import { HttpMethod } from '@activepieces/pieces-common';

import { scrapegraphaiClient } from './client';
import type {
	ScrapegraphaiAuthValue,
	ScrapegraphaiExtractParams,
	ScrapegraphaiExtractResult,
	ScrapegraphaiScrapeParams,
	ScrapegraphaiScrapeResult,
	ScrapegraphaiValidateResult,
} from './types';

async function validateApiKey({ auth }: { auth: ScrapegraphaiAuthValue }): Promise<ScrapegraphaiValidateResult> {
	return await scrapegraphaiClient.request<ScrapegraphaiValidateResult>({
		auth,
		method: HttpMethod.GET,
		path: '/validate',
	});
}

async function scrape({
	auth,
	...body
}: ScrapegraphaiScrapeParams & { auth: ScrapegraphaiAuthValue }): Promise<ScrapegraphaiScrapeResult> {
	return await scrapegraphaiClient.request<ScrapegraphaiScrapeResult>({
		auth,
		method: HttpMethod.POST,
		path: '/scrape',
		body,
	});
}

async function extract({
	auth,
	...body
}: ScrapegraphaiExtractParams & { auth: ScrapegraphaiAuthValue }): Promise<ScrapegraphaiExtractResult> {
	return await scrapegraphaiClient.request<ScrapegraphaiExtractResult>({
		auth,
		method: HttpMethod.POST,
		path: '/extract',
		body,
	});
}

export const scrapegraphaiApi = { validateApiKey, scrape, extract };
