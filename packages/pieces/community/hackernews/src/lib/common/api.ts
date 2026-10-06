import { HttpMethod } from '@activepieces/pieces-common';
import { chunk } from '@activepieces/pieces-framework';

import { hackernewsClient } from './client';

import type {
	HackernewsItem,
	HackernewsNormalizedItem,
	HackernewsNormalizedUser,
	HackernewsStoryList,
	HackernewsUpdates,
	HackernewsUser,
} from './types';

async function listStoryIds({ storyList }: { storyList: HackernewsStoryList }): Promise<number[]> {
	return await hackernewsClient.request<number[]>({
		method: HttpMethod.GET,
		path: `/${storyList}stories.json`,
	});
}

async function getItem({ itemId }: { itemId: number }): Promise<HackernewsItem | null> {
	return await hackernewsClient.request<HackernewsItem | null>({
		method: HttpMethod.GET,
		path: `/item/${itemId}.json`,
	});
}

async function listTopStories({ limit }: { limit: number }): Promise<(HackernewsItem | null)[]> {
	const topStoryIds = await listStoryIds({ storyList: 'top' });
	const stories: (HackernewsItem | null)[] = [];
	for (let i = 0; i < Math.min(limit, topStoryIds.length); i++) {
		stories.push(await getItem({ itemId: topStoryIds[i] }));
	}
	return stories;
}

async function listStories({
	storyList,
	limit,
}: {
	storyList: HackernewsStoryList;
	limit: number | undefined;
}): Promise<{ stories: HackernewsNormalizedItem[]; count: number }> {
	const resolvedLimit = resolveLimit({ limit });
	const storyIds = await listStoryIds({ storyList });
	const items: (HackernewsItem | null)[] = [];
	for (const batch of chunk(storyIds.slice(0, resolvedLimit), ITEM_BATCH_SIZE)) {
		items.push(...(await Promise.all(batch.map(async (itemId) => await getItem({ itemId })))));
	}
	const stories = items
		.filter((item): item is HackernewsItem => item !== null)
		.map((item) => normalizeItem({ item }));
	return { stories, count: stories.length };
}

async function findItem({ itemId }: { itemId: number }): Promise<HackernewsNormalizedItem> {
	const item = await getItem({ itemId: resolveId({ id: itemId, label: 'Item ID' }) });
	if (item === null) {
		throw new Error(`Hacker News item ${itemId} was not found.`);
	}
	return normalizeItem({ item });
}

async function getUser({ username }: { username: string }): Promise<HackernewsNormalizedUser> {
	const trimmed = username.trim();
	if (trimmed.length === 0) {
		throw new Error('Username is required.');
	}
	const user = await hackernewsClient.request<HackernewsUser | null>({
		method: HttpMethod.GET,
		path: `/user/${encodeURIComponent(trimmed)}.json`,
	});
	if (user === null) {
		throw new Error(`Hacker News user "${trimmed}" was not found. Usernames are case-sensitive.`);
	}
	const submitted = user.submitted ?? [];
	return {
		username: user.id,
		karma: user.karma,
		about: user.about ?? null,
		created_at: new Date(user.created * 1000).toISOString(),
		created: user.created,
		submitted_count: submitted.length,
		recent_submission_ids: submitted.slice(0, MAX_SUBMISSION_IDS),
		hn_url: `https://news.ycombinator.com/user?id=${encodeURIComponent(user.id)}`,
	};
}

async function getMaxItemId(): Promise<{ max_item_id: number }> {
	const maxItemId = await hackernewsClient.request<number>({
		method: HttpMethod.GET,
		path: '/maxitem.json',
	});
	return { max_item_id: maxItemId };
}

async function getUpdates(): Promise<{
	item_ids: number[];
	profiles: string[];
	item_count: number;
	profile_count: number;
}> {
	const updates = await hackernewsClient.request<HackernewsUpdates>({
		method: HttpMethod.GET,
		path: '/updates.json',
	});
	return {
		item_ids: updates.items,
		profiles: updates.profiles,
		item_count: updates.items.length,
		profile_count: updates.profiles.length,
	};
}

function normalizeItem({ item }: { item: HackernewsItem }): HackernewsNormalizedItem {
	return {
		id: item.id,
		type: item.type ?? null,
		title: item.title ?? null,
		url: item.url ?? null,
		text: item.text ?? null,
		author: item.by ?? null,
		score: item.score ?? null,
		comment_count: item.descendants ?? null,
		created_at: item.time === undefined ? null : new Date(item.time * 1000).toISOString(),
		time: item.time ?? null,
		parent_id: item.parent ?? null,
		poll_id: item.poll ?? null,
		kid_ids: item.kids ?? [],
		part_ids: item.parts ?? [],
		dead: item.dead ?? false,
		deleted: item.deleted ?? false,
		hn_url: `https://news.ycombinator.com/item?id=${item.id}`,
	};
}

function resolveLimit({ limit }: { limit: number | undefined }): number {
	if (limit === undefined || limit === null) {
		return DEFAULT_LIMIT;
	}
	if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
		throw new Error(`Limit must be a whole number between 1 and ${MAX_LIMIT}.`);
	}
	return limit;
}

function resolveId({ id, label }: { id: number; label: string }): number {
	if (!Number.isInteger(id) || id < 1) {
		throw new Error(`${label} must be a positive whole number.`);
	}
	return id;
}

export const hackernewsApi = {
	listStoryIds,
	getItem,
	listTopStories,
	listStories,
	findItem,
	getUser,
	getMaxItemId,
	getUpdates,
};

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const MAX_SUBMISSION_IDS = 100;
const ITEM_BATCH_SIZE = 10;
