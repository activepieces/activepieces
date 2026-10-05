import { HttpMethod } from '@activepieces/pieces-common';
import { hackernewsClient } from './client';
import type { HackernewsItem } from './types';

async function listTopStoryIds(): Promise<string[]> {
  return await hackernewsClient.request<string[]>({
    method: HttpMethod.GET,
    path: '/topstories.json',
  });
}

async function getItem({ itemId }: { itemId: string }): Promise<HackernewsItem> {
  return await hackernewsClient.request<HackernewsItem>({
    method: HttpMethod.GET,
    path: `/item/${itemId}.json`,
  });
}

async function listTopStories({ limit }: { limit: number }): Promise<HackernewsItem[]> {
  const topStoryIds = await listTopStoryIds();
  const stories: HackernewsItem[] = [];
  for (let i = 0; i < Math.min(limit, topStoryIds.length); i++) {
    stories.push(await getItem({ itemId: topStoryIds[i] }));
  }
  return stories;
}

export const hackernewsApi = { listTopStoryIds, getItem, listTopStories };
