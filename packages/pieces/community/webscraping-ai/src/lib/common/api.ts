import { HttpMethod, HttpResponse } from '@activepieces/pieces-common';

import { webscrapingAiClient } from './client';

import type {
	WebscrapingAiAccount,
	WebscrapingAiAuthValue,
	WebscrapingAiDataResult,
	WebscrapingAiFieldsResult,
	WebscrapingAiPageParams,
	WebscrapingAiPageText,
	WebscrapingAiPost,
	WebscrapingAiQueryValue,
	WebscrapingAiResult,
	WebscrapingAiScrapeParams,
	WebscrapingAiSerpResult,
} from './types';

function pageQuery({
	url,
	headers,
	timeout,
	js,
	jsTimeout,
	waitFor,
	proxy,
	country,
	customProxy,
	jsScript,
	device,
	errorOn404,
	errorOnRedirect,
}: WebscrapingAiPageParams): Record<string, WebscrapingAiQueryValue> {
	return {
		url,
		headers:
			headers && headers.length > 0
				? JSON.stringify(
						Object.fromEntries(
							headers.flatMap((h) =>
								typeof h === 'object' && h !== null && 'name' in h && 'value' in h
									? [[h.name, h.value]]
									: [],
							),
						),
				  )
				: undefined,
		timeout,
		js,
		js_timeout: jsTimeout,
		wait_for: waitFor,
		proxy: proxy && PROXIES.includes(proxy) ? proxy : undefined,
		country: country && COUNTRIES.includes(country) ? country : undefined,
		custom_proxy: customProxy,
		device,
		error_on_404: errorOn404,
		error_on_redirect: errorOnRedirect,
		js_script: jsScript,
	};
}

function responseFormat({ format }: { format?: string }): string | undefined {
	return format === 'json' || format === 'text' ? format : undefined;
}

async function askQuestion({
	auth,
	question,
	format,
	...page
}: WebscrapingAiPageParams & {
	auth: WebscrapingAiAuthValue;
	question: string;
	format?: string;
}): Promise<HttpResponse<unknown>> {
	return await webscrapingAiClient.request<unknown>({
		auth,
		path: '/ai/question',
		query: { ...pageQuery(page), question, format: responseFormat({ format }) },
	});
}

async function getPageHtml({
	auth,
	returnScriptResult,
	format,
	...page
}: WebscrapingAiPageParams & {
	auth: WebscrapingAiAuthValue;
	returnScriptResult?: boolean;
	format?: string;
}): Promise<HttpResponse<unknown>> {
	return await webscrapingAiClient.request<unknown>({
		auth,
		path: '/html',
		query: {
			...pageQuery(page),
			return_script_result: returnScriptResult,
			format: responseFormat({ format }),
		},
	});
}

async function getPageText({
	auth,
	textFormat,
	returnLinks,
	...page
}: WebscrapingAiPageParams & {
	auth: WebscrapingAiAuthValue;
	textFormat?: string;
	returnLinks?: boolean;
}): Promise<HttpResponse<unknown>> {
	return await webscrapingAiClient.request<unknown>({
		auth,
		path: '/text',
		query: {
			...pageQuery(page),
			text_format: textFormat && TEXT_FORMATS.includes(textFormat) ? textFormat : undefined,
			return_links: textFormat === 'json' ? returnLinks : undefined,
		},
	});
}

async function getStructuredData({
	auth,
	fields,
	...page
}: WebscrapingAiPageParams & {
	auth: WebscrapingAiAuthValue;
	fields?: Record<string, unknown>;
}): Promise<HttpResponse<unknown>> {
	return await webscrapingAiClient.request<unknown>({
		auth,
		path: '/ai/fields',
		query: {
			...pageQuery(page),
			...Object.fromEntries(
				Object.entries(fields ?? {}).map(([key, value]) => [`fields[${key}]`, String(value)]),
			),
		},
	});
}

async function getAccount({
	auth,
}: {
	auth: WebscrapingAiAuthValue;
}): Promise<HttpResponse<unknown>> {
	return await webscrapingAiClient.request<unknown>({ auth, path: '/account' });
}

function scrapeQuery({
	url,
	headers,
	timeout,
	js,
	jsTimeout,
	waitFor,
	proxy,
	country,
	customProxy,
	device,
	errorOn404,
	errorOnRedirect,
}: WebscrapingAiScrapeParams): Record<string, WebscrapingAiQueryValue> {
	return {
		url,
		headers: headers === undefined ? undefined : JSON.stringify(headers),
		timeout,
		js,
		js_timeout: jsTimeout,
		wait_for: waitFor,
		proxy,
		country,
		custom_proxy: customProxy,
		device,
		error_on_404: errorOn404,
		error_on_redirect: errorOnRedirect,
	};
}

function postOptions({ post }: { post?: WebscrapingAiPost }) {
	return post
		? { method: HttpMethod.POST, body: post.body, contentType: post.contentType }
		: { method: HttpMethod.GET };
}

async function scrapeHtml({
	auth,
	post,
	jsScript,
	returnScriptResult,
	...page
}: WebscrapingAiScrapeParams & {
	auth: WebscrapingAiAuthValue;
	post?: WebscrapingAiPost;
	jsScript?: string;
	returnScriptResult?: boolean;
}): Promise<WebscrapingAiResult> {
	const response = await webscrapingAiClient.request<WebscrapingAiResult>({
		auth,
		...postOptions({ post }),
		path: '/html',
		query: {
			...scrapeQuery(page),
			js_script: jsScript,
			return_script_result: returnScriptResult,
			format: 'json',
		},
	});
	return response.body;
}

async function scrapeText({
	auth,
	post,
	returnLinks,
	...page
}: WebscrapingAiScrapeParams & {
	auth: WebscrapingAiAuthValue;
	post?: WebscrapingAiPost;
	returnLinks?: boolean;
}): Promise<WebscrapingAiPageText> {
	const response = await webscrapingAiClient.request<WebscrapingAiPageText>({
		auth,
		...postOptions({ post }),
		path: '/text',
		query: { ...scrapeQuery(page), text_format: 'json', return_links: returnLinks },
	});
	return response.body;
}

async function scrapeSelected({
	auth,
	post,
	selector,
	...page
}: WebscrapingAiScrapeParams & {
	auth: WebscrapingAiAuthValue;
	post?: WebscrapingAiPost;
	selector: string;
}): Promise<WebscrapingAiResult> {
	const response = await webscrapingAiClient.request<WebscrapingAiResult>({
		auth,
		...postOptions({ post }),
		path: '/selected',
		query: { ...scrapeQuery(page), selector, format: 'json' },
	});
	return response.body;
}

async function scrapeSelectedMultiple({
	auth,
	post,
	selectors,
	...page
}: WebscrapingAiScrapeParams & {
	auth: WebscrapingAiAuthValue;
	post?: WebscrapingAiPost;
	selectors: string[];
}): Promise<{ results: string[][]; count: number }> {
	const response = await webscrapingAiClient.request<string[][]>({
		auth,
		...postOptions({ post }),
		path: '/selected-multiple',
		query: { ...scrapeQuery(page), selectors },
	});
	return { results: response.body, count: response.body.length };
}

async function answerQuestion({
	auth,
	question,
	...page
}: WebscrapingAiScrapeParams & {
	auth: WebscrapingAiAuthValue;
	question: string;
}): Promise<WebscrapingAiResult> {
	const response = await webscrapingAiClient.request<WebscrapingAiResult>({
		auth,
		path: '/ai/question',
		query: { ...scrapeQuery(page), question, format: 'json' },
	});
	return response.body;
}

async function extractFields({
	auth,
	fields,
	...page
}: WebscrapingAiScrapeParams & {
	auth: WebscrapingAiAuthValue;
	fields: Record<string, unknown>;
}): Promise<WebscrapingAiFieldsResult> {
	const response = await webscrapingAiClient.request<WebscrapingAiFieldsResult>({
		auth,
		path: '/ai/fields',
		query: {
			...scrapeQuery(page),
			...Object.fromEntries(
				Object.entries(fields).map(([key, value]) => [`fields[${key}]`, String(value)]),
			),
		},
	});
	return response.body;
}

async function searchGoogle({
	auth,
	query,
	countryCode,
	languageCode,
	page,
}: {
	auth: WebscrapingAiAuthValue;
	query: string;
	countryCode?: string;
	languageCode?: string;
	page?: number;
}): Promise<WebscrapingAiSerpResult> {
	const response = await webscrapingAiClient.request<WebscrapingAiSerpResult>({
		auth,
		path: '/serp',
		query: { q: query, engine: 'google', gl: countryCode, hl: languageCode, page },
	});
	return response.body;
}

async function getSiteData({
	auth,
	url,
	country,
	transcript,
	transcriptLanguage,
}: {
	auth: WebscrapingAiAuthValue;
	url: string;
	country?: string;
	transcript?: boolean;
	transcriptLanguage?: string;
}): Promise<WebscrapingAiDataResult> {
	const response = await webscrapingAiClient.request<WebscrapingAiDataResult>({
		auth,
		path: '/data',
		query: { url, country, transcript, transcript_language: transcriptLanguage },
	});
	return response.body;
}

async function getAccountInfo({
	auth,
}: {
	auth: WebscrapingAiAuthValue;
}): Promise<WebscrapingAiAccount> {
	const response = await webscrapingAiClient.request<WebscrapingAiAccount>({
		auth,
		path: '/account',
	});
	return response.body;
}

export const webscrapingAiApi = {
	askQuestion,
	getPageHtml,
	getPageText,
	getStructuredData,
	getAccount,
	scrapeHtml,
	scrapeText,
	scrapeSelected,
	scrapeSelectedMultiple,
	answerQuestion,
	extractFields,
	searchGoogle,
	getSiteData,
	getAccountInfo,
};

const PROXIES = ['datacenter', 'residential'];
const COUNTRIES = ['us', 'gb', 'de', 'it', 'fr', 'ca', 'es', 'ru', 'jp', 'kr', 'in'];
const TEXT_FORMATS = ['json', 'plain', 'xml'];
