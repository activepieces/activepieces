import { createHash } from 'node:crypto';

import FeedParser from 'feedparser';

import { Store, tryCatch } from '@activepieces/pieces-framework';

import { rssFeedClient } from './feed-client';

async function enable({
	store,
	urls,
	isRepublish,
}: {
	store: Store;
	urls: unknown[];
	isRepublish: boolean;
}): Promise<void> {
	const feedUrls = normalizeUrls({ urls });
	const existing = await loadCursors({ store, urls: feedUrls });
	const missing = isRepublish ? feedUrls.filter((url) => existing.get(url) === null) : feedUrls;
	if (missing.length > 0) {
		const fetched = await fetchFeeds({ urls: missing });
		const failed = fetched.filter((feed) => feed.error !== null);
		if (!isRepublish && failed.length === fetched.length) {
			throw new Error(describeFailures({ failed }));
		}
		logFailures({ failed });
		const legacyMarks = isRepublish ? await readLegacyMarks({ store, fetched }) : new Map<string, number | null>();
		const now = currentSecond();
		await Promise.all(
			fetched.map((feed) => {
				const legacyMark = legacyMarks.get(feed.url) ?? null;
				return store.put(
					cursorKey({ url: feed.url }),
					feed.error === null
						? startCursor({ items: feed.items, feedUrl: feed.url, mark: legacyMark, now })
						: { publishedAt: Math.min(legacyMark ?? now, now), seen: [], pendingBaseline: true },
				);
			}),
		);
	}
	await clearLegacy({ store });
}

async function poll({ store, urls }: { store: Store; urls: unknown[] }): Promise<FeedParser.Item[]> {
	const feedUrls = normalizeUrls({ urls });
	const cursors = await loadCursors({ store, urls: feedUrls });
	const fetched = await fetchFeeds({ urls: feedUrls });
	const failed = fetched.filter((feed) => feed.error !== null);
	if (failed.length === fetched.length) {
		throw new Error(describeFailures({ failed }));
	}
	logFailures({ failed });
	const uncursored = fetched.filter((feed) => cursors.get(feed.url) === null);
	const legacyMarks =
		uncursored.length > 0 ? await readLegacyMarks({ store, fetched }) : new Map<string, number | null>();
	const knownKeys = new Set([...cursors.values()].flatMap((cursor) => cursor?.seen ?? []));
	const crossByFeed = knownCrossKeys({ fetched, cursors });
	const now = currentSecond();

	const { emitted, nextCursors } = fetched.reduce<PollAccumulator>(
		(acc, feed) => {
			if (feed.error !== null) {
				return acc;
			}
			const cursor = resolveCursor({
				stored: cursors.get(feed.url) ?? null,
				items: feed.items,
				feedUrl: feed.url,
				legacyMark: legacyMarks.get(feed.url) ?? null,
				now,
			});
			if (cursor === null) {
				return {
					...acc,
					nextCursors: [
						...acc.nextCursors,
						{
							url: feed.url,
							cursor: startCursor({ items: feed.items, feedUrl: feed.url, mark: null, now }),
						},
					],
				};
			}
			if (feed.items.length === 0) {
				return { ...acc, nextCursors: [...acc.nextCursors, { url: feed.url, cursor }] };
			}
			const seen = new Set(cursor.seen);
			const next = advanceCursor({ cursor, items: feed.items, feedUrl: feed.url, now });
			const recorded = new Set(next.seen);
			const otherCross = crossKeysOfOtherFeeds({ crossByFeed, url: feed.url });
			const candidates = feed.items
				.map((item) => ({
					item,
					key: itemKey({ item, feedUrl: feed.url }),
					shared: crossKey({ item, feedUrl: feed.url }),
				}))
				.filter(
					({ item, key, shared }) =>
						isNewForCursor({ cursor, seen, item, key, feedUrl: feed.url }) &&
						!isKnownElsewhere({ item, shared, knownKeys, otherCross }) &&
						(shared === null || !acc.emittedKeys.has(shared)),
				);
			const fresh = new Map(
				candidates
					.filter(({ key }) => recorded.has(key))
					.reverse()
					.map((candidate) => [candidate.key, candidate]),
			);
			if (cursor.overflow === true) {
				console.warn(
					`RSS feed ${feed.url} lists more than ${MAX_SEEN_KEYS} items; until it lists fewer, only items dated after the newest known item can start a run.`,
				);
			}
			const unrecorded = candidates.filter(({ key }) => !recorded.has(key)).length;
			if (unrecorded > 0) {
				console.warn(
					`RSS feed ${feed.url} lists more new or undated items than the trigger can remember; skipped ${unrecorded} of them.`,
				);
			}
			const emittedNow = [...fresh.values()].reverse();
			return {
				emitted: [
					...acc.emitted,
					...emittedNow.map(({ item }) => withAbsoluteLink({ item, feedUrl: feed.url })),
				],
				emittedKeys: new Set([
					...acc.emittedKeys,
					...emittedNow.flatMap(({ shared }) => (shared === null ? [] : [shared])),
				]),
				nextCursors: [...acc.nextCursors, { url: feed.url, cursor: next }],
			};
		},
		{ emitted: [], emittedKeys: new Set(), nextCursors: [] },
	);

	await Promise.all(
		nextCursors.map(({ url, cursor }) => store.put(cursorKey({ url }), cursor)),
	);
	if (uncursored.length > 0 && uncursored.every((feed) => feed.error === null)) {
		await clearLegacy({ store });
	}
	return sortNewestFirst({ items: emitted });
}

async function sample({ urls }: { urls: unknown[] }): Promise<FeedParser.Item[]> {
	const fetched = await fetchFeeds({ urls: normalizeUrls({ urls }) });
	const failed = fetched.filter((feed) => feed.error !== null);
	if (failed.length === fetched.length) {
		throw new Error(describeFailures({ failed }));
	}
	const unique = new Map(
		fetched
			.flatMap((feed) =>
				feed.items.map((item) => ({
					shared: crossKey({ item, feedUrl: feed.url }),
					item: withAbsoluteLink({ item, feedUrl: feed.url }),
				})),
			)
			.reverse()
			.map(({ shared, item }, index) => [shared ?? `unkeyed|${index}`, item]),
	);
	return sortNewestFirst({ items: [...unique.values()].reverse() }).slice(0, SAMPLE_SIZE);
}

export const rssFeedPoller = { enable, poll, sample };

function normalizeUrls({ urls }: { urls: unknown[] }): string[] {
	const feedUrls = [
		...new Set(
			urls
				.filter((url): url is string => typeof url === 'string')
				.map((url) => url.trim())
				.filter((url) => url.length > 0),
		),
	];
	if (feedUrls.length === 0) {
		throw new Error('Provide at least one feed URL.');
	}
	return feedUrls;
}

async function fetchFeeds({ urls }: { urls: string[] }): Promise<FetchedFeed[]> {
	return Promise.all(
		urls.map(async (url) => {
			const { data, error } = await tryCatch(() => rssFeedClient.fetchItems({ url }));
			return error ? { url, items: [], error: error.message } : { url, items: data, error: null };
		}),
	);
}

async function loadCursors({
	store,
	urls,
}: {
	store: Store;
	urls: string[];
}): Promise<Map<string, FeedCursor | null>> {
	const entries = await Promise.all(
		urls.map(async (url): Promise<[string, FeedCursor | null]> => {
			const stored = await store.get<unknown>(cursorKey({ url }));
			return [url, isFeedCursor(stored) ? stored : null];
		}),
	);
	return new Map(entries);
}

function isFeedCursor(value: unknown): value is FeedCursor {
	return (
		typeof value === 'object' &&
		value !== null &&
		'publishedAt' in value &&
		'seen' in value &&
		(value.publishedAt === null || typeof value.publishedAt === 'number') &&
		Array.isArray(value.seen) &&
		value.seen.every((key) => typeof key === 'string') &&
		(!('pendingBaseline' in value) || typeof value.pendingBaseline === 'boolean') &&
		(!('cross' in value) ||
			(Array.isArray(value.cross) && value.cross.every((key) => typeof key === 'string'))) &&
		(!('overflow' in value) || typeof value.overflow === 'boolean')
	);
}

function resolveCursor({
	stored,
	items,
	feedUrl,
	legacyMark,
	now,
}: {
	stored: FeedCursor | null;
	items: FeedParser.Item[];
	feedUrl: string;
	legacyMark: number | null;
	now: number;
}): FeedCursor | null {
	if (stored === null) {
		return legacyMark === null ? null : startCursor({ items, feedUrl, mark: legacyMark, now });
	}
	if (stored.pendingBaseline === true) {
		return startCursor({ items, feedUrl, mark: stored.publishedAt ?? now, now });
	}
	return stored;
}

function startCursor({
	items,
	feedUrl,
	mark,
	now,
}: {
	items: FeedParser.Item[];
	feedUrl: string;
	mark: number | null;
	now: number;
}): FeedCursor {
	if (mark === null) {
		return advanceCursor({ cursor: { publishedAt: null, seen: [] }, items, feedUrl, now });
	}
	const undated = items.filter((item) => publishedAtOf({ item }) === null);
	const keys = [...new Set(keysNewestFirst({ items: undated, feedUrl }))];
	return {
		publishedAt: Math.min(mark, now),
		seen: keys.slice(0, MAX_SEEN_KEYS),
		cross: crossKeysNewestFirst({ items: undated, feedUrl }).slice(0, MAX_CROSS_KEYS),
		...overflowFlag({ count: keys.length }),
	};
}

function advanceCursor({
	cursor,
	items,
	feedUrl,
	now,
}: {
	cursor: FeedCursor;
	items: FeedParser.Item[];
	feedUrl: string;
	now: number;
}): FeedCursor {
	const publishedAt = items.reduce<number | null>((latest, item) => {
		const published = publishedAtOf({ item });
		if (published === null) {
			return latest;
		}
		const capped = Math.min(published, now);
		return latest === null || capped > latest ? capped : latest;
	}, cursor.publishedAt);
	const floor = cursor.publishedAt ?? publishedAt;
	const stillComparable = items.filter((item) => {
		const published = publishedAtOf({ item });
		return published === null || floor === null || published >= floor;
	});
	const atOrAfterCursor = items.filter((item) => needsContentKey({ item, publishedAt }));
	const required = [...new Set(keysNewestFirst({ items: stillComparable, feedUrl }))];
	const requiredItemKeys = new Set(required);
	const atOrAfterCursorContent = [...new Set(contentKeys({ items: atOrAfterCursor }))].filter(
		(key) => !requiredItemKeys.has(key),
	);
	const requiredSet = new Set([...required, ...atOrAfterCursorContent]);
	const retained = cursor.seen
		.filter((key) => !requiredSet.has(key))
		.slice(0, MAX_RETAINED_PREVIOUS_KEYS);
	const requiredCross = crossKeysNewestFirst({ items: stillComparable, feedUrl });
	const requiredCrossSet = new Set(requiredCross);
	const retainedCross = (cursor.cross ?? [])
		.filter((key) => !requiredCrossSet.has(key))
		.slice(0, MAX_RETAINED_PREVIOUS_KEYS);
	return {
		publishedAt,
		seen: [...required, ...atOrAfterCursorContent, ...retained].slice(0, MAX_SEEN_KEYS),
		cross: [...requiredCross, ...retainedCross].slice(0, MAX_CROSS_KEYS),
		...overflowFlag({ count: required.length }),
	};
}

function overflowFlag({ count }: { count: number }): { overflow?: true } {
	return count > MAX_SEEN_KEYS ? { overflow: true } : {};
}

function knownCrossKeys({
	fetched,
	cursors,
}: {
	fetched: FetchedFeed[];
	cursors: Map<string, FeedCursor | null>;
}): Map<string, Set<string>> {
	return new Map(
		fetched.map((feed) => {
			const stored = cursors.get(feed.url) ?? null;
			const seen = new Set(stored?.seen ?? []);
			const bridge = crossKeysNewestFirst({
				items: feed.items.filter((item) => isSeen({ seen, item, feedUrl: feed.url })),
				feedUrl: feed.url,
			});
			return [feed.url, new Set([...(stored?.cross ?? []), ...bridge])];
		}),
	);
}

function crossKeysOfOtherFeeds({
	crossByFeed,
	url,
}: {
	crossByFeed: Map<string, Set<string>>;
	url: string;
}): Set<string> {
	return new Set(
		[...crossByFeed.entries()]
			.filter(([feedUrl]) => feedUrl !== url)
			.flatMap(([, keys]) => [...keys]),
	);
}

function isKnownElsewhere({
	item,
	shared,
	knownKeys,
	otherCross,
}: {
	item: FeedParser.Item;
	shared: string | null;
	knownKeys: Set<string>;
	otherCross: Set<string>;
}): boolean {
	if (shared === null) {
		return false;
	}
	return isBareGuid({ item }) ? otherCross.has(shared) : knownKeys.has(shared) || otherCross.has(shared);
}

function isNewForCursor({
	cursor,
	seen,
	item,
	key,
	feedUrl,
}: {
	cursor: FeedCursor;
	seen: Set<string>;
	item: FeedParser.Item;
	key: string;
	feedUrl: string;
}): boolean {
	if (seen.has(key) || isSeenUnderPreviousKey({ seen, item, feedUrl })) {
		return false;
	}
	const published = publishedAtOf({ item });
	if (needsContentKey({ item, publishedAt: cursor.publishedAt })) {
		const content = contentKey({ item });
		if (content !== null && seen.has(content)) {
			return false;
		}
	}
	if (cursor.overflow === true) {
		return published !== null && (cursor.publishedAt === null || published > cursor.publishedAt);
	}
	return published === null || cursor.publishedAt === null || published >= cursor.publishedAt;
}

function isSeen({
	seen,
	item,
	feedUrl,
}: {
	seen: Set<string>;
	item: FeedParser.Item;
	feedUrl: string;
}): boolean {
	return seen.has(itemKey({ item, feedUrl })) || isSeenUnderPreviousKey({ seen, item, feedUrl });
}

function isSeenUnderPreviousKey({
	seen,
	item,
	feedUrl,
}: {
	seen: Set<string>;
	item: FeedParser.Item;
	feedUrl: string;
}): boolean {
	const previous = previousItemKey({ item, feedUrl });
	return previous !== null && seen.has(previous);
}

async function readLegacyMarks({
	store,
	fetched,
}: {
	store: Store;
	fetched: FetchedFeed[];
}): Promise<Map<string, number | null>> {
	const lastPublishSeconds = await store.get<unknown>(LEGACY_PUBLISH_DATE_KEY);
	if (typeof lastPublishSeconds === 'number' && Number.isFinite(lastPublishSeconds)) {
		const mark = (lastPublishSeconds + 1) * 1000;
		return new Map(fetched.map((feed) => [feed.url, mark]));
	}
	const lastItemId = await store.get<unknown>(LEGACY_LAST_ITEM_KEY);
	return new Map(
		fetched.map((feed) => [feed.url, markFromLegacyLastItem({ items: feed.items, lastItemId })]),
	);
}

function markFromLegacyLastItem({
	items,
	lastItemId,
}: {
	items: FeedParser.Item[];
	lastItemId: unknown;
}): number | null {
	if (lastItemId === null || lastItemId === undefined) {
		return null;
	}
	const index = items.findIndex((item) => legacyItemId({ item }) === lastItemId);
	if (index === -1) {
		return null;
	}
	const newestAlreadySeen = items.slice(index).reduce<number | null>((latest, item) => {
		const published = publishedAtOf({ item });
		return published !== null && (latest === null || published > latest) ? published : latest;
	}, null);
	return newestAlreadySeen === null ? null : newestAlreadySeen + 1;
}

function legacyItemId({ item }: { item: FeedParser.Item }): string {
	const raw: Record<string, unknown> = { ...item };
	if (item.guid) {
		return item.guid;
	}
	if (typeof raw['id'] === 'string' && raw['id'].length > 0) {
		return raw['id'];
	}
	return JSON.stringify(item);
}

async function clearLegacy({ store }: { store: Store }): Promise<void> {
	await Promise.all([store.delete(LEGACY_LAST_ITEM_KEY), store.delete(LEGACY_PUBLISH_DATE_KEY)]);
}

function currentSecond(): number {
	return Math.floor(Date.now() / 1000) * 1000;
}

function publishedAtOf({ item }: { item: FeedParser.Item }): number | null {
	const date = item.pubdate ?? item.date;
	if (!(date instanceof Date)) {
		return null;
	}
	const time = date.getTime();
	return Number.isNaN(time) ? null : time;
}

function itemKey({ item, feedUrl }: { item: FeedParser.Item; feedUrl: string }): string {
	const published = publishedAtOf({ item });
	const identity = item.guid
		? scopedGuid({ guid: item.guid, link: absoluteLink({ link: item.link, feedUrl }) })
		: item.link ||
			(item.title ? `${item.title}|${published ?? ''}` : JSON.stringify({ ...item, meta: undefined }));
	return hashKey({ identity });
}

function contentKey({ item }: { item: FeedParser.Item }): string | null {
	if (!item.title) {
		return null;
	}
	const published = publishedAtOf({ item });
	if (published !== null) {
		return hashKey({ identity: `c|${item.title}|${published}` });
	}
	return hasOwnGuid({ item })
		? null
		: hashKey({ identity: `c|${item.title}|undated|${stableLinkOf({ link: item.link })}` });
}

function stableLinkOf({ link }: { link: string | null | undefined }): string {
	if (!link) {
		return '';
	}
	if (URL.canParse(link)) {
		const url = new URL(link);
		return `${url.origin}${url.pathname}`;
	}
	return link.split(/[?#]/)[0];
}

function needsContentKey({
	item,
	publishedAt,
}: {
	item: FeedParser.Item;
	publishedAt: number | null;
}): boolean {
	const published = publishedAtOf({ item });
	if (published === null) {
		return !hasOwnGuid({ item });
	}
	return publishedAt !== null && published >= publishedAt;
}

function hasOwnGuid({ item }: { item: FeedParser.Item }): boolean {
	return Boolean(item.guid) && item.guid !== item.link;
}

function contentKeys({ items }: { items: FeedParser.Item[] }): string[] {
	return items.flatMap((item) => {
		const key = contentKey({ item });
		return key === null ? [] : [key];
	});
}

function previousItemKey({ item, feedUrl }: { item: FeedParser.Item; feedUrl: string }): string | null {
	if (!isBareGuid({ item }) || !item.link || URL.canParse(item.link)) {
		return null;
	}
	const previous = hashKey({ identity: `${item.guid}|${item.link}` });
	return previous === itemKey({ item, feedUrl }) ? null : previous;
}

function crossKey({ item, feedUrl }: { item: FeedParser.Item; feedUrl: string }): string | null {
	if (isBareGuid({ item })) {
		return bareGuidCrossKey({ item, feedUrl });
	}
	if (!item.guid && item.link) {
		return hashKey({ identity: absoluteLink({ link: item.link, feedUrl }) ?? item.link });
	}
	return itemKey({ item, feedUrl });
}

function storedCrossKey({ item, feedUrl }: { item: FeedParser.Item; feedUrl: string }): string | null {
	const key = crossKey({ item, feedUrl });
	return key !== null && key !== itemKey({ item, feedUrl }) ? key : null;
}

function bareGuidCrossKey({ item, feedUrl }: { item: FeedParser.Item; feedUrl: string }): string | null {
	const link = absoluteLink({ link: item.link, feedUrl });
	return item.guid && link ? hashKey({ identity: `x|${item.guid}|${link}` }) : null;
}

function crossKeysNewestFirst({
	items,
	feedUrl,
}: {
	items: FeedParser.Item[];
	feedUrl: string;
}): string[] {
	return [
		...new Set(
			sortNewestFirst({ items }).flatMap((item) => {
				const key = storedCrossKey({ item, feedUrl });
				return key === null ? [] : [key];
			}),
		),
	];
}

function hashKey({ identity }: { identity: string }): string {
	return createHash('sha256').update(identity).digest('hex').slice(0, SEEN_KEY_LENGTH);
}

function isBareGuid({ item }: { item: FeedParser.Item }): boolean {
	return Boolean(item.guid) && !isGloballyUniqueGuid({ guid: item.guid });
}

function isGloballyUniqueGuid({ guid }: { guid: string }): boolean {
	return guid.includes('://') || /^(urn|tag):/i.test(guid);
}

function scopedGuid({ guid, link }: { guid: string; link: string | null | undefined }): string {
	return isGloballyUniqueGuid({ guid }) ? guid : `${guid}|${linkScope({ link })}`;
}

function absoluteLink({
	link,
	feedUrl,
}: {
	link: string | null | undefined;
	feedUrl: string;
}): string | null {
	if (!link) {
		return null;
	}
	if (URL.canParse(link)) {
		return link;
	}
	return URL.canParse(link, feedUrl) ? new URL(link, feedUrl).href : link;
}

function withAbsoluteLink({ item, feedUrl }: { item: FeedParser.Item; feedUrl: string }): FeedParser.Item {
	const link = absoluteLink({ link: item.link, feedUrl });
	return link === null || link === item.link ? item : { ...item, link };
}

function linkScope({ link }: { link: string | null | undefined }): string {
	if (!link) {
		return '';
	}
	if (!URL.canParse(link)) {
		return link;
	}
	const { origin } = new URL(link);
	return origin === 'null' ? link : origin;
}

function keysNewestFirst({ items, feedUrl }: { items: FeedParser.Item[]; feedUrl: string }): string[] {
	return sortNewestFirst({ items }).map((item) => itemKey({ item, feedUrl }));
}

function sortNewestFirst({ items }: { items: FeedParser.Item[] }): FeedParser.Item[] {
	return [...items].sort((a, b) => {
		const aTime = publishedAtOf({ item: a });
		const bTime = publishedAtOf({ item: b });
		if (aTime === bTime) {
			return 0;
		}
		if (aTime === null) {
			return 1;
		}
		if (bTime === null) {
			return -1;
		}
		return bTime - aTime;
	});
}

function cursorKey({ url }: { url: string }): string {
	return `${CURSOR_KEY_PREFIX}${createHash('sha256').update(url).digest('hex').slice(0, 32)}`;
}

function describeFailures({ failed }: { failed: FetchedFeed[] }): string {
	return failed.length === 1
		? failed[0].error ?? 'The feed could not be loaded.'
		: `None of the feeds could be loaded: ${failed.map((feed) => feed.error).join('; ')}`;
}

function logFailures({ failed }: { failed: FetchedFeed[] }): void {
	failed.forEach((feed) => console.error(`RSS feed skipped this poll: ${feed.error}`));
}

const CURSOR_KEY_PREFIX = 'rss_feed_';
const LEGACY_LAST_ITEM_KEY = 'lastItem';
const LEGACY_PUBLISH_DATE_KEY = '_lastRssPublishDate';
const MAX_SEEN_KEYS = 20_000;
const MAX_RETAINED_PREVIOUS_KEYS = 1000;
const MAX_CROSS_KEYS = 2_000;
const SEEN_KEY_LENGTH = 16;
const SAMPLE_SIZE = 5;

type FeedCursor = {
	publishedAt: number | null;
	seen: string[];
	pendingBaseline?: boolean;
	cross?: string[];
	overflow?: boolean;
};

type FetchedFeed = {
	url: string;
	items: FeedParser.Item[];
	error: string | null;
};

type PollAccumulator = {
	emitted: FeedParser.Item[];
	emittedKeys: Set<string>;
	nextCursors: { url: string; cursor: FeedCursor }[];
};
