import type { AppConnectionType } from '@activepieces/pieces-framework';

export type WebscrapingAiAuthValue = { type: AppConnectionType.SECRET_TEXT; secret_text: string };

export type WebscrapingAiQueryValue = string | number | boolean | null | undefined;

export type WebscrapingAiPageParams = {
	url: string;
	headers?: unknown[];
	timeout?: number;
	js?: boolean;
	jsTimeout?: number;
	waitFor?: string;
	proxy?: string;
	country?: string;
	customProxy?: string;
	jsScript?: string;
	device?: string;
	errorOn404?: boolean;
	errorOnRedirect?: boolean;
};

export type WebscrapingAiScrapeParams = {
	url: string;
	headers?: Record<string, unknown>;
	timeout?: number;
	js?: boolean;
	jsTimeout?: number;
	waitFor?: string;
	proxy?: string;
	country?: string;
	customProxy?: string;
	device?: string;
	errorOn404?: boolean;
	errorOnRedirect?: boolean;
};

export type WebscrapingAiPost = { body: string; contentType: string };

export type WebscrapingAiResult = { result?: string };

export type WebscrapingAiFieldsResult = { result?: Record<string, string | null> };

export type WebscrapingAiPageText = {
	title?: string;
	description?: string;
	content?: string;
	links?: string[];
};

export type WebscrapingAiSerpResult = {
	search_parameters?: Record<string, unknown>;
	search_information?: Record<string, unknown>;
	organic_results?: Record<string, unknown>[];
	related_searches?: Record<string, unknown>[];
	pagination?: Record<string, unknown>;
};

export type WebscrapingAiDataResult = {
	request_parameters?: Record<string, unknown>;
	parse_status?: string;
	data?: Record<string, unknown>;
};

export type WebscrapingAiAccount = {
	email?: string;
	remaining_api_calls?: number;
	remaining_monthly_credits?: number;
	remaining_payg_credits?: number;
	remaining_total_credits?: number;
	resets_at?: number;
	remaining_concurrency?: number;
};
