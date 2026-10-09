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

export type ScrapegraphaiSearchParams = {
	query: string;
	numResults?: number;
	prompt?: string;
	schema?: Record<string, unknown>;
	format?: string;
	mode?: string;
	timeRange?: string;
	locationGeoCode?: string;
	fetchConfig?: Record<string, unknown>;
};

export type ScrapegraphaiSearchResult = {
	id?: string;
	results?: { url?: string; title?: string; content?: string }[];
	json?: unknown;
	raw?: string | null;
	usage?: { promptTokens?: number; completionTokens?: number };
	metadata?: Record<string, unknown>;
};

export type ScrapegraphaiCrawlParams = {
	url: string;
	formats?: ScrapegraphaiFormat[];
	maxPages?: number;
	maxDepth?: number;
	maxLinksPerPage?: number;
	allowExternal?: boolean;
	includePatterns?: unknown[];
	excludePatterns?: unknown[];
	fetchConfig?: Record<string, unknown>;
};

export type ScrapegraphaiCrawl = {
	id?: string;
	status?: string;
	reason?: string | null;
	total?: number;
	finished?: number;
	pages?: Record<string, unknown>[];
};

export type ScrapegraphaiCrawlPages = {
	data?: Record<string, unknown>[];
	pagination?: { limit?: number; nextCursor?: string | number | null };
};

export type ScrapegraphaiOk = { ok?: boolean };

export type ScrapegraphaiMonitorUpdateParams = {
	name?: string;
	interval?: string;
	formats?: ScrapegraphaiFormat[];
	webhookUrl?: string;
	fetchConfig?: Record<string, unknown>;
};

export type ScrapegraphaiMonitorCreateParams = ScrapegraphaiMonitorUpdateParams & {
	url: string;
	interval: string;
};

export type ScrapegraphaiMonitor = {
	cronId?: string;
	scheduleId?: string;
	interval?: string;
	status?: string;
	reason?: string | null;
	consecutiveFailures?: number;
	config?: Record<string, unknown>;
	createdAt?: string;
	updatedAt?: string;
};

export type ScrapegraphaiMonitorActivity = {
	ticks?: Record<string, unknown>[];
	nextCursor?: string | null;
};

export type ScrapegraphaiHistoryEntry = {
	id?: string;
	service?: string;
	status?: string;
	error?: unknown;
	elapsedMs?: number;
	createdAt?: string;
	requestParentId?: string | null;
	sessionId?: string | null;
	params?: Record<string, unknown>;
	result?: unknown;
};

export type ScrapegraphaiHistoryPage = {
	data?: ScrapegraphaiHistoryEntry[];
	pagination?: { page?: number; limit?: number; total?: number };
};

export type ScrapegraphaiCredits = {
	remaining?: number;
	used?: number;
	plan?: string;
	jobs?: Record<string, { used?: number; limit?: number }>;
};
