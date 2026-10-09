import type { AppConnectionType } from '@activepieces/pieces-framework';

export type ScrapegraphaiAuthValue = { type: AppConnectionType.SECRET_TEXT; secret_text: string };

export type ScrapegraphaiFormat = {
	type: string;
	mode?: string;
	prompt?: string;
	schema?: Record<string, unknown>;
};

export type ScrapegraphaiScrapeParams = {
	url: string;
	formats: ScrapegraphaiFormat[];
	contentType?: string;
	fetchConfig?: Record<string, unknown>;
};

export type ScrapegraphaiExtractParams = {
	url?: string;
	html?: string;
	markdown?: string;
	prompt: string;
	schema?: Record<string, unknown>;
	mode?: string;
	fetchConfig?: Record<string, unknown>;
};

export type ScrapegraphaiScrapeResult = {
	id?: string;
	results?: Record<string, unknown>;
	metadata?: Record<string, unknown>;
	errors?: unknown;
};

export type ScrapegraphaiExtractResult = {
	id?: string;
	raw?: string | null;
	json?: unknown;
	usage?: { promptTokens?: number; completionTokens?: number };
	metadata?: Record<string, unknown>;
};

export type ScrapegraphaiValidateResult = { email?: string };
