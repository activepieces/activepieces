import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { youtubeAuth } from '../common/auth';
import { listCommentsOutputSchema } from '../output-schemas';

export const youtubeListCommentsAction = createAction({
  auth: youtubeAuth,
  outputSchema: listCommentsOutputSchema,
  name: 'list_comments',
  classification: 'SEARCH',
  displayName: 'List Comments',
  description: 'List the top-level comment threads on a video.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists comment threads on a YouTube video using commentThreads.list, returning each top-level comment with its author, text, like count and reply count. Use it to read audience feedback on a video for triage, sentiment or moderation flows. Comments must be enabled on the video, otherwise YouTube answers 403. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    videoId: Property.ShortText({
      displayName: 'Video ID',
      description: 'The `v` parameter in a YouTube URL (e.g. `dQw4w9WgXcQ`).',
      required: true,
    }),
    order: Property.StaticDropdown({
      displayName: 'Order',
      description: 'Comment ordering.',
      required: false,
      options: {
        options: [
          { label: 'Relevance', value: 'relevance' },
          { label: 'Time', value: 'time' },
        ],
      },
    }),
    maxResults: Property.Number({
      displayName: 'Max Results',
      description: 'Number of threads to return (1-100, default 20).',
      required: false,
      defaultValue: 20,
    }),
    pageToken: Property.ShortText({
      displayName: 'Page Token',
      description: 'Token from a previous response, to fetch the next page.',
      required: false,
    }),
  },
  async run(context) {
    const accessToken = context.auth.access_token;
    const { videoId, order, maxResults, pageToken } = context.propsValue;

    if (maxResults !== undefined && maxResults !== null) {
      const maxResultsNumber = Math.trunc(Number(maxResults));
      if (!Number.isFinite(maxResultsNumber) || maxResultsNumber < 1 || maxResultsNumber > 100) {
        throw new Error('Max Results must be between 1 and 100.');
      }
    }

    const queryParams: Record<string, string> = {
      part: 'snippet,replies',
      videoId,
      maxResults: String(Math.trunc(Number(maxResults ?? 20))),
    };
    if (order) {
      queryParams['order'] = order;
    }
    if (pageToken) {
      queryParams['pageToken'] = pageToken;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://www.googleapis.com/youtube/v3/commentThreads',
      headers: { Authorization: `Bearer ${accessToken}` },
      queryParams,
    });

    return response.body;
  },
});
