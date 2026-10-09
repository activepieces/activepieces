import { HttpResponse } from '@activepieces/pieces-common';

import { webscrapingAiClient } from './client';

import type {
	WebscrapingAiAuthValue,
	WebscrapingAiPageParams,
	WebscrapingAiQueryValue,
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

export const webscrapingAiApi = {
	askQuestion,
	getPageHtml,
	getPageText,
	getStructuredData,
	getAccount,
};

const PROXIES = ['datacenter', 'residential'];
const COUNTRIES = ['us', 'gb', 'de', 'it', 'fr', 'ca', 'es', 'ru', 'jp', 'kr', 'in'];
const TEXT_FORMATS = ['json', 'plain', 'xml'];
