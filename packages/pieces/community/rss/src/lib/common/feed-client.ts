import FeedParser from 'feedparser';

import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { tryCatch } from '@activepieces/pieces-framework';

async function fetchFeed({ url }: { url: string }): Promise<ParsedFeed> {
	const response = await sendGet<Buffer>({ url, responseType: 'arraybuffer' });
	return parseFeed({ body: response.body, url });
}

async function fetchPage({ url }: { url: string }): Promise<FetchedPage> {
	const response = await sendGet<string>({ url, responseType: 'text' });
	const contentType = response.headers?.['content-type'];
	return {
		body: response.body,
		contentType: (Array.isArray(contentType) ? contentType[0] : contentType) ?? '',
	};
}

async function parseFeed({
	body,
	url,
}: {
	body: Buffer | string;
	url: string;
}): Promise<ParsedFeed> {
	const { meta, items } = await runFeedParser({ body, url });
	return {
		feed: toFeed({ meta, url }),
		items: items.map(toItem),
	};
}

function filterItems({
	items,
	publishedAfter,
	keyword,
	limit,
}: {
	items: FeedItem[];
	publishedAfter: string | undefined;
	keyword: string | undefined;
	limit: number | undefined;
}): FeedItem[] {
	const after = publishedAfter ? Date.parse(publishedAfter) : undefined;
	if (after !== undefined && Number.isNaN(after)) {
		throw new Error(`"${publishedAfter}" is not a valid date for Published After.`);
	}
	const needle = keyword?.trim().toLowerCase();
	return items
		.filter(
			(item) =>
				after === undefined ||
				(item.published_at !== null && Date.parse(item.published_at) > after),
		)
		.filter(
			(item) =>
				!needle ||
				[item.title, item.summary, item.content].some((text) =>
					text?.toLowerCase().includes(needle),
				),
		)
		.sort(compareNewestFirst)
		.slice(0, clampLimit({ limit }));
}

export const rssFeedClient = { fetchFeed, fetchPage, parseFeed, filterItems };

async function sendGet<T>({
	url,
	responseType,
}: {
	url: string;
	responseType: 'arraybuffer' | 'text';
}) {
	const { data, error } = await tryCatch(() =>
		withDeadline({
			promise: httpClient.sendRequest<T>({
				method: HttpMethod.GET,
				url,
				responseType,
				timeout: FETCH_TIMEOUT_MS,
			}),
		}),
	);
	if (error) {
		const status = error instanceof HttpError ? ` (HTTP ${error.response.status})` : '';
		const cause = describeCause({ cause: error.cause });
		throw new Error(
			`Could not load ${url}${status}: ${error.message}${cause ? ` (${cause})` : ''}`,
		);
	}
	return data;
}

function withDeadline<T>({ promise }: { promise: Promise<T> }): Promise<T> {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const deadline = new Promise<never>((_, reject) => {
		timer = setTimeout(
			() => reject(new Error(`timed out after ${FETCH_TIMEOUT_MS / 1000}s`)),
			FETCH_TIMEOUT_MS,
		);
	});
	return Promise.race([promise, deadline]).finally(() => clearTimeout(timer));
}

function describeCause({ cause }: { cause: unknown }): string {
	if (typeof cause !== 'object' || cause === null) {
		return '';
	}
	if ('code' in cause && typeof cause.code === 'string') {
		return cause.code;
	}
	return cause instanceof Error ? cause.message : '';
}

function runFeedParser({
	body,
	url,
}: {
	body: Buffer | string;
	url: string;
}): Promise<{ meta: FeedParser.Meta | null; items: FeedParser.Item[] }> {
	return new Promise((resolve, reject) => {
		const parser = new FeedParser({ feedurl: url });
		const items: FeedParser.Item[] = [];
		let meta: FeedParser.Meta | null = null;
		parser.on('meta', (parsedMeta: FeedParser.Meta) => {
			meta = parsedMeta;
		});
		parser.on('readable', () => {
			let item = parser.read();
			while (item) {
				items.push(item);
				item = parser.read();
			}
		});
		parser.on('end', () => resolve({ meta, items }));
		parser.on('error', (error: Error) =>
			reject(new Error(`${url} is not a valid RSS or Atom feed: ${error.message}`)),
		);
		parser.write(body);
		parser.end();
	});
}

function toFeed({ meta, url }: { meta: FeedParser.Meta | null; url: string }): FeedInfo {
	return {
		title: meta?.title || null,
		description: meta?.description || null,
		site_url: meta?.link || null,
		feed_url: meta?.xmlurl || url,
		language: meta?.language || null,
		author: meta?.author || null,
		updated_at: toIso(meta?.date ?? meta?.pubdate ?? null),
		image_url: meta?.image?.url || null,
		format: meta?.['#type'] ?? null,
	};
}

function toItem(item: FeedParser.Item): FeedItem {
	return {
		id: item.guid || item.link || null,
		title: item.title || null,
		link: item.origlink || item.link || null,
		author: item.author || null,
		published_at: toIso(item.pubdate ?? item.date),
		updated_at: toIso(item.date),
		summary: item.summary || null,
		content: item.description || null,
		categories: item.categories ?? [],
		image_url: item.image?.url || null,
		enclosures: (item.enclosures ?? []).map((enclosure) => ({
			url: enclosure.url,
			type: enclosure.type || null,
			length: enclosure.length ? Number(enclosure.length) : null,
		})),
	};
}

function toIso(date: Date | null): string | null {
	return date && !Number.isNaN(date.getTime()) ? date.toISOString() : null;
}

function compareNewestFirst(a: FeedItem, b: FeedItem): number {
	if (a.published_at === b.published_at) {
		return 0;
	}
	if (a.published_at === null) {
		return 1;
	}
	if (b.published_at === null) {
		return -1;
	}
	return Date.parse(b.published_at) - Date.parse(a.published_at);
}

function clampLimit({ limit }: { limit: number | undefined }): number {
	if (limit === undefined || limit === null) {
		return DEFAULT_LIMIT;
	}
	return Math.min(Math.max(Math.floor(limit), 1), MAX_LIMIT);
}

const DEFAULT_LIMIT = 20;
const FETCH_TIMEOUT_MS = 20_000;
const MAX_LIMIT = 100;

type FetchedPage = {
	body: string;
	contentType: string;
};

export type FeedInfo = {
	title: string | null;
	description: string | null;
	site_url: string | null;
	feed_url: string;
	language: string | null;
	author: string | null;
	updated_at: string | null;
	image_url: string | null;
	format: FeedParser.Type | null;
};

export type FeedItem = {
	id: string | null;
	title: string | null;
	link: string | null;
	author: string | null;
	published_at: string | null;
	updated_at: string | null;
	summary: string | null;
	content: string | null;
	categories: string[];
	image_url: string | null;
	enclosures: { url: string; type: string | null; length: number | null }[];
};

export type ParsedFeed = {
	feed: FeedInfo;
	items: FeedItem[];
};
