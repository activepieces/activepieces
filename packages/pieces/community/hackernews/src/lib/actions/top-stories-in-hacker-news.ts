import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const fetchTopStories = createAction({
  name: 'fetch_top_stories', // Must be a unique across the piece, this shouldn't be changed.
  displayName: 'Fetch Top Stories',
  description: 'Fetch top stories from hackernews',
  audience: 'both',
  aiMetadata: {
    description: 'Retrieves the current top stories from Hacker News, returning the first N stories (N set by the number-of-stories input) with their full item details. Use to surface or summarize what is trending on Hacker News right now. Read-only and idempotent; a larger N simply fetches more of the same ranked list.',
    idempotent: true,
  },
  props: {
    // Properties to ask from the user, in this ask we will take number of
    number_of_stories: Property.Number({
      displayName: 'Number of Stories',
      description: undefined,
      required: true,
    }),
  },
  async run(configValue) {
    const HACKER_NEWS_API_URL = 'https://hacker-news.firebaseio.com/v0/';
    const topStoryIdsResponse = await httpClient.sendRequest<string[]>({
      method: HttpMethod.GET,
      url: `${HACKER_NEWS_API_URL}topstories.json`,
    });
    const topStoryIds: string[] = topStoryIdsResponse.body;
    const topStories: Record<string, unknown>[] = [];
    for (
      let i = 0;
      i <
      Math.min(configValue.propsValue['number_of_stories'], topStoryIds.length);
      i++
    ) {
      const storyId = topStoryIds[i];
      const storyResponse = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${HACKER_NEWS_API_URL}item/${storyId}.json`,
      });
      topStories.push(storyResponse.body);
    }
    return topStories;
  },
});