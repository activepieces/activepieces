import { Readable } from 'node:stream';

import FeedParser from 'feedparser';

import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { tryCatch } from '@activepieces/pieces-framework';

async function fetchFeed({ url }: { url: string }): Promise<ParsedFeed> {
	const response = await sendGet({ url, accept: FEED_ACCEPT });
	return parseFeed({ body: decodeBody(response), url });
}

async function fetchItems({ url }: { url: string }): Promise<FeedParser.Item[]> {
	const response = await sendGet({ url, accept: FEED_ACCEPT });
	const { items } = await runFeedParser({
		body: decodeBody(response),
		url,
		options: { addmeta: true },
	});
	return items;
}

async function fetchPage({ url }: { url: string }): Promise<FetchedPage> {
	const response = await sendGet({ url, accept: PAGE_ACCEPT });
	return {
		body: toText({ body: decodeBody(response) }),
		contentType: response.contentType,
	};
}

async function parseFeed({
	body,
	url,
}: {
	body: Buffer | string;
	url: string;
}): Promise<ParsedFeed> {
	const { meta, items } = await runFeedParser({ body, url, options: { feedurl: url } });
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

export const rssFeedClient = { fetchFeed, fetchItems, fetchPage, parseFeed, filterItems };

async function sendGet({ url, accept }: { url: string; accept: string }): Promise<FetchedBody> {
	const deadline = new AbortController();
	const timer = setTimeout(() => deadline.abort(), FETCH_TIMEOUT_MS);
	const { data, error } = await tryCatch(async () => {
		const response = await untilDeadline({
			promise: httpClient.sendRequest({
				method: HttpMethod.GET,
				url,
				responseType: 'stream',
				timeout: FETCH_TIMEOUT_MS,
				headers: { Accept: accept },
			}),
			signal: deadline.signal,
		});
		const body = await readCapped({
			stream: response.body,
			contentLength: headerValue({ headers: response.headers, name: 'content-length' }),
			signal: deadline.signal,
		});
		return { body, contentType: headerValue({ headers: response.headers, name: 'content-type' }) };
	}).finally(() => clearTimeout(timer));
	if (error) {
		const status = error instanceof HttpError ? ` (HTTP ${error.response.status})` : '';
		const cause = describeCause({ cause: error.cause });
		throw new Error(
			`Could not load ${url}${status}: ${error.message}${cause ? ` (${cause})` : ''}`,
		);
	}
	return data;
}

function untilDeadline<T extends { body: unknown }>({
	promise,
	signal,
}: {
	promise: Promise<T>;
	signal: AbortSignal;
}): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const onAbort = () => {
			reject(timeoutError());
			promise.then(
				(late) => destroyBody({ body: late.body }),
				() => undefined,
			);
		};
		if (signal.aborted) {
			onAbort();
			return;
		}
		signal.addEventListener('abort', onAbort, { once: true });
		promise.then(
			(value) => {
				signal.removeEventListener('abort', onAbort);
				if (signal.aborted) {
					destroyBody({ body: value.body });
					return;
				}
				resolve(value);
			},
			(error: unknown) => {
				signal.removeEventListener('abort', onAbort);
				reject(signal.aborted ? timeoutError() : error);
			},
		);
	});
}

function readCapped({
	stream,
	contentLength,
	signal,
}: {
	stream: unknown;
	contentLength: string;
	signal: AbortSignal;
}): Promise<Buffer> {
	if (!(stream instanceof Readable)) {
		return Promise.reject(new Error('the response has no readable body'));
	}
	const declared = Number(contentLength);
	if (contentLength !== '' && Number.isFinite(declared) && declared > MAX_RESPONSE_BYTES) {
		stream.destroy();
		return Promise.reject(tooLargeError());
	}
	return new Promise<Buffer>((resolve, reject) => {
		const chunks: Buffer[] = [];
		let size = 0;
		const onAbort = () => stream.destroy(timeoutError());
		const cleanup = () => signal.removeEventListener('abort', onAbort);
		if (signal.aborted) {
			onAbort();
		} else {
			signal.addEventListener('abort', onAbort, { once: true });
		}
		stream.on('data', (chunk: Buffer | string) => {
			const bytes = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
			size += bytes.length;
			if (size > MAX_RESPONSE_BYTES) {
				stream.destroy(tooLargeError());
				return;
			}
			chunks.push(bytes);
		});
		stream.once('error', (error) => {
			cleanup();
			reject(error);
		});
		stream.once('end', () => {
			cleanup();
			resolve(Buffer.concat(chunks, size));
		});
		stream.once('close', () => {
			cleanup();
			reject(new Error('the connection closed before the response was complete'));
		});
	});
}

function destroyBody({ body }: { body: unknown }): void {
	if (body instanceof Readable) {
		body.destroy();
	}
}

function headerValue({
	headers,
	name,
}: {
	headers: Record<string, string | string[] | undefined> | undefined;
	name: string;
}): string {
	const value = headers?.[name];
	return (Array.isArray(value) ? value[0] : value) ?? '';
}

function timeoutError(): Error {
	return new Error(`timed out after ${FETCH_TIMEOUT_MS / 1000}s`);
}

function tooLargeError(): Error {
	return new Error(
		`the response is too large (more than ${MAX_RESPONSE_BYTES / (1024 * 1024)} MB)`,
	);
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

function decodeBody({ body, contentType }: FetchedBody): Buffer | string {
	if (hasUnicodeBom({ body })) {
		return body;
	}
	const label = charsetFromContentType({ contentType }) ?? charsetFromXmlDeclaration({ body });
	if (label === null || UNICODE_CHARSET.test(label)) {
		return body;
	}
	const { data: decoder } = tryCatchSync(() => new TextDecoder(label));
	return decoder ? decoder.decode(body) : body;
}

function toText({ body }: { body: Buffer | string }): string {
	return typeof body === 'string' ? body : new TextDecoder().decode(body);
}

function hasUnicodeBom({ body }: { body: Buffer }): boolean {
	return (
		(body[0] === 0xef && body[1] === 0xbb && body[2] === 0xbf) ||
		(body[0] === 0xfe && body[1] === 0xff) ||
		(body[0] === 0xff && body[1] === 0xfe)
	);
}

function charsetFromContentType({ contentType }: { contentType: string }): string | null {
	const match = /;\s*charset\s*=\s*"?([^";\s]+)"?/i.exec(contentType);
	return match ? match[1].toLowerCase() : null;
}

function charsetFromXmlDeclaration({ body }: { body: Buffer }): string | null {
	const head = body.subarray(0, XML_DECLARATION_SCAN_BYTES).toString('latin1');
	const match = /^\s*<\?xml[^>]*?\sencoding\s*=\s*["']([^"']+)["']/i.exec(head);
	return match ? match[1].toLowerCase() : null;
}

function tryCatchSync<T>(fn: () => T): { data: T | null } {
	try {
		return { data: fn() };
	} catch {
		return { data: null };
	}
}

function runFeedParser({
	body,
	url,
	options,
}: {
	body: Buffer | string;
	url: string;
	options: FeedParser.Options;
}): Promise<{ meta: FeedParser.Meta | null; items: FeedParser.Item[] }> {
	return new Promise((resolve, reject) => {
		const parser = new FeedParser(options);
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
const MAX_RESPONSE_BYTES = 20 * 1024 * 1024;
const XML_DECLARATION_SCAN_BYTES = 512;
const UNICODE_CHARSET = /^(utf-?8|utf-?16(le|be)?|unicode-1-1-utf-8)$/;
const FEED_ACCEPT =
	'application/rss+xml, application/atom+xml, application/rdf+xml;q=0.9, application/xml;q=0.9, text/xml;q=0.9, */*;q=0.8';
const PAGE_ACCEPT = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';

type FetchedBody = {
	body: Buffer;
	contentType: string;
};

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
