import { HttpMethod, QueryParams } from '@activepieces/pieces-common';

import { scrapegraphaiClient } from './client';

import type {
	ScrapegraphaiAuthValue,
	ScrapegraphaiCrawl,
	ScrapegraphaiCrawlPages,
	ScrapegraphaiCrawlParams,
	ScrapegraphaiCredits,
	ScrapegraphaiExtractParams,
	ScrapegraphaiExtractResult,
	ScrapegraphaiHistoryEntry,
	ScrapegraphaiHistoryPage,
	ScrapegraphaiMonitor,
	ScrapegraphaiMonitorActivity,
	ScrapegraphaiMonitorCreateParams,
	ScrapegraphaiMonitorUpdateParams,
	ScrapegraphaiOk,
	ScrapegraphaiScrapeParams,
	ScrapegraphaiScrapeResult,
	ScrapegraphaiSearchParams,
	ScrapegraphaiSearchResult,
	ScrapegraphaiValidateResult,
} from './types';

function toQuery({ values }: { values: Record<string, string | number | undefined> }): QueryParams {
	return Object.fromEntries(
		Object.entries(values).flatMap(([key, value]) =>
			value === undefined ? [] : [[key, String(value)]],
		),
	);
}

async function validateApiKey({
	auth,
}: {
	auth: ScrapegraphaiAuthValue;
}): Promise<ScrapegraphaiValidateResult> {
	return await scrapegraphaiClient.request<ScrapegraphaiValidateResult>({
		auth,
		method: HttpMethod.GET,
		path: '/validate',
	});
}

async function scrape({
	auth,
	...body
}: ScrapegraphaiScrapeParams & {
	auth: ScrapegraphaiAuthValue;
}): Promise<ScrapegraphaiScrapeResult> {
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
}: ScrapegraphaiExtractParams & {
	auth: ScrapegraphaiAuthValue;
}): Promise<ScrapegraphaiExtractResult> {
	return await scrapegraphaiClient.request<ScrapegraphaiExtractResult>({
		auth,
		method: HttpMethod.POST,
		path: '/extract',
		body,
	});
}

async function search({
	auth,
	...body
}: ScrapegraphaiSearchParams & {
	auth: ScrapegraphaiAuthValue;
}): Promise<ScrapegraphaiSearchResult> {
	return await scrapegraphaiClient.request<ScrapegraphaiSearchResult>({
		auth,
		method: HttpMethod.POST,
		path: '/search',
		body,
	});
}

async function startCrawl({
	auth,
	...body
}: ScrapegraphaiCrawlParams & { auth: ScrapegraphaiAuthValue }): Promise<ScrapegraphaiCrawl> {
	return await scrapegraphaiClient.request<ScrapegraphaiCrawl>({
		auth,
		method: HttpMethod.POST,
		path: '/crawl',
		body,
	});
}

async function getCrawl({
	auth,
	crawlId,
}: {
	auth: ScrapegraphaiAuthValue;
	crawlId: string;
}): Promise<ScrapegraphaiCrawl> {
	return await scrapegraphaiClient.request<ScrapegraphaiCrawl>({
		auth,
		method: HttpMethod.GET,
		path: `/crawl/${encodeURIComponent(crawlId)}`,
	});
}

async function listCrawlPages({
	auth,
	crawlId,
	limit,
	cursor,
}: {
	auth: ScrapegraphaiAuthValue;
	crawlId: string;
	limit?: number;
	cursor?: number;
}): Promise<ScrapegraphaiCrawlPages> {
	return await scrapegraphaiClient.request<ScrapegraphaiCrawlPages>({
		auth,
		method: HttpMethod.GET,
		path: `/crawl/${encodeURIComponent(crawlId)}/pages`,
		query: toQuery({ values: { limit, cursor } }),
	});
}

async function stopCrawl({
	auth,
	crawlId,
}: {
	auth: ScrapegraphaiAuthValue;
	crawlId: string;
}): Promise<ScrapegraphaiOk> {
	return await scrapegraphaiClient.request<ScrapegraphaiOk>({
		auth,
		method: HttpMethod.POST,
		path: `/crawl/${encodeURIComponent(crawlId)}/stop`,
	});
}

async function resumeCrawl({
	auth,
	crawlId,
}: {
	auth: ScrapegraphaiAuthValue;
	crawlId: string;
}): Promise<ScrapegraphaiOk> {
	return await scrapegraphaiClient.request<ScrapegraphaiOk>({
		auth,
		method: HttpMethod.POST,
		path: `/crawl/${encodeURIComponent(crawlId)}/resume`,
	});
}

async function deleteCrawl({
	auth,
	crawlId,
}: {
	auth: ScrapegraphaiAuthValue;
	crawlId: string;
}): Promise<ScrapegraphaiOk> {
	return await scrapegraphaiClient.request<ScrapegraphaiOk>({
		auth,
		method: HttpMethod.DELETE,
		path: `/crawl/${encodeURIComponent(crawlId)}`,
	});
}

async function createMonitor({
	auth,
	...body
}: ScrapegraphaiMonitorCreateParams & {
	auth: ScrapegraphaiAuthValue;
}): Promise<ScrapegraphaiMonitor> {
	return await scrapegraphaiClient.request<ScrapegraphaiMonitor>({
		auth,
		method: HttpMethod.POST,
		path: '/monitor',
		body,
	});
}

async function listMonitors({
	auth,
}: {
	auth: ScrapegraphaiAuthValue;
}): Promise<ScrapegraphaiMonitor[]> {
	return await scrapegraphaiClient.request<ScrapegraphaiMonitor[]>({
		auth,
		method: HttpMethod.GET,
		path: '/monitor',
	});
}

async function getMonitor({
	auth,
	monitorId,
}: {
	auth: ScrapegraphaiAuthValue;
	monitorId: string;
}): Promise<ScrapegraphaiMonitor> {
	return await scrapegraphaiClient.request<ScrapegraphaiMonitor>({
		auth,
		method: HttpMethod.GET,
		path: `/monitor/${encodeURIComponent(monitorId)}`,
	});
}

async function updateMonitor({
	auth,
	monitorId,
	...body
}: ScrapegraphaiMonitorUpdateParams & {
	auth: ScrapegraphaiAuthValue;
	monitorId: string;
}): Promise<ScrapegraphaiMonitor> {
	return await scrapegraphaiClient.request<ScrapegraphaiMonitor>({
		auth,
		method: HttpMethod.PATCH,
		path: `/monitor/${encodeURIComponent(monitorId)}`,
		body,
	});
}

async function pauseMonitor({
	auth,
	monitorId,
}: {
	auth: ScrapegraphaiAuthValue;
	monitorId: string;
}): Promise<ScrapegraphaiMonitor> {
	return await scrapegraphaiClient.request<ScrapegraphaiMonitor>({
		auth,
		method: HttpMethod.POST,
		path: `/monitor/${encodeURIComponent(monitorId)}/pause`,
	});
}

async function resumeMonitor({
	auth,
	monitorId,
}: {
	auth: ScrapegraphaiAuthValue;
	monitorId: string;
}): Promise<ScrapegraphaiMonitor> {
	return await scrapegraphaiClient.request<ScrapegraphaiMonitor>({
		auth,
		method: HttpMethod.POST,
		path: `/monitor/${encodeURIComponent(monitorId)}/resume`,
	});
}

async function deleteMonitor({
	auth,
	monitorId,
}: {
	auth: ScrapegraphaiAuthValue;
	monitorId: string;
}): Promise<ScrapegraphaiOk> {
	return await scrapegraphaiClient.request<ScrapegraphaiOk>({
		auth,
		method: HttpMethod.DELETE,
		path: `/monitor/${encodeURIComponent(monitorId)}`,
	});
}

async function listMonitorActivity({
	auth,
	monitorId,
	limit,
	cursor,
}: {
	auth: ScrapegraphaiAuthValue;
	monitorId: string;
	limit?: number;
	cursor?: string;
}): Promise<ScrapegraphaiMonitorActivity> {
	return await scrapegraphaiClient.request<ScrapegraphaiMonitorActivity>({
		auth,
		method: HttpMethod.GET,
		path: `/monitor/${encodeURIComponent(monitorId)}/activity`,
		query: toQuery({ values: { limit, cursor } }),
	});
}

async function listHistory({
	auth,
	page,
	limit,
	service,
	sessionId,
}: {
	auth: ScrapegraphaiAuthValue;
	page?: number;
	limit?: number;
	service?: string;
	sessionId?: string;
}): Promise<ScrapegraphaiHistoryPage> {
	return await scrapegraphaiClient.request<ScrapegraphaiHistoryPage>({
		auth,
		method: HttpMethod.GET,
		path: '/history',
		query: toQuery({ values: { page, limit, service, sessionId } }),
	});
}

async function getHistoryEntry({
	auth,
	requestId,
}: {
	auth: ScrapegraphaiAuthValue;
	requestId: string;
}): Promise<ScrapegraphaiHistoryEntry> {
	return await scrapegraphaiClient.request<ScrapegraphaiHistoryEntry>({
		auth,
		method: HttpMethod.GET,
		path: `/history/${encodeURIComponent(requestId)}`,
	});
}

async function getCredits({
	auth,
}: {
	auth: ScrapegraphaiAuthValue;
}): Promise<ScrapegraphaiCredits> {
	return await scrapegraphaiClient.request<ScrapegraphaiCredits>({
		auth,
		method: HttpMethod.GET,
		path: '/credits',
	});
}

export const scrapegraphaiApi = {
	validateApiKey,
	scrape,
	extract,
	search,
	startCrawl,
	getCrawl,
	listCrawlPages,
	stopCrawl,
	resumeCrawl,
	deleteCrawl,
	createMonitor,
	listMonitors,
	getMonitor,
	updateMonitor,
	pauseMonitor,
	resumeMonitor,
	deleteMonitor,
	listMonitorActivity,
	listHistory,
	getHistoryEntry,
	getCredits,
};
