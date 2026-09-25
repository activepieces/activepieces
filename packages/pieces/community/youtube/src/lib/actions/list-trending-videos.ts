import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { youtubeAuth } from '../common/auth';
import { listTrendingVideosOutputSchema } from '../output-schemas';
import { youtubeClient } from '../common/client';

export const youtubeListTrendingVideosAction = createAction({
  auth: youtubeAuth,
  outputSchema: listTrendingVideosOutputSchema,
  name: 'list_trending_videos',
  classification: 'SEARCH',
  displayName: 'List Trending Videos',
  description: 'List the most popular videos in a region, optionally by category.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the currently most popular YouTube videos for a region via videos.list with the mostPopular chart, returning full video details including statistics. Use it for trending discovery; use Search YouTube when a free-text query is needed, which costs far more quota. Region Code is an ISO 3166-1 alpha-2 country code and defaults to US. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    regionCode: Property.ShortText({
      displayName: 'Region Code',
      description:
        'ISO 3166-1 alpha-2 country code (for example: US, DE, JP). Defaults to US.',
      required: false,
      defaultValue: 'US',
    }),
    videoCategoryId: Property.ShortText({
      displayName: 'Video Category ID',
      description:
        'Restrict the chart to one video category ID (for example: 10 for Music). Leave blank for all categories.',
      required: false,
    }),
    maxResults: Property.Number({
      displayName: 'Max Results',
      description: 'Number of videos to return (1-50, default 25).',
      required: false,
      defaultValue: 25,
    }),
    pageToken: Property.ShortText({
      displayName: 'Page Token',
      description: 'Token from a previous response, to fetch the next page.',
      required: false,
    }),
  },
  async run(context) {
    const accessToken = context.auth.access_token;
    const { regionCode, videoCategoryId, maxResults, pageToken } =
      context.propsValue;

    if (maxResults !== undefined && maxResults !== null) {
      const maxResultsNumber = Math.trunc(Number(maxResults));
      if (
        !Number.isFinite(maxResultsNumber) ||
        maxResultsNumber < 1 ||
        maxResultsNumber > 50
      ) {
        throw new Error('Max Results must be between 1 and 50.');
      }
    }

    const queryParams: Record<string, string> = {
      part: 'snippet,contentDetails,statistics',
      chart: 'mostPopular',
      regionCode: regionCode ?? 'US',
      maxResults: String(Math.trunc(Number(maxResults ?? 25))),
    };

    if (videoCategoryId) {
      queryParams['videoCategoryId'] = videoCategoryId;
    }
    if (pageToken) {
      queryParams['pageToken'] = pageToken;
    }

    return youtubeClient.sendRequest({
      accessToken,
      method: HttpMethod.GET,
      path: '/videos',
      operation: 'List Trending Videos',
      queryParams,
    });
  },
});
