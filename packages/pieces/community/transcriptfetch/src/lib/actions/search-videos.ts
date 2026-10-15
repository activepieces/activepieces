import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { transcriptFetchAuth } from '../auth';
import { compact, transcriptFetchRequest } from '../common';

export const searchVideosAction = createAction({
  name: 'search_videos',
  displayName: 'Search Videos',
  description: 'Searches YouTube, TikTok or Instagram for videos matching a query.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description: 'Searches YouTube, TikTok or Instagram for videos matching a keyword query via the TranscriptFetch API and returns video IDs, titles and URLs, with a cursor for the next page. Read-only.',
    idempotent: true,
  },
  auth: transcriptFetchAuth,
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      required: true,
    }),
    platform: Property.StaticDropdown({
      displayName: 'Platform',
      required: false,
      defaultValue: 'youtube',
      options: {
        options: [
          { label: 'YouTube', value: 'youtube' },
          { label: 'TikTok', value: 'tiktok' },
          { label: 'Instagram', value: 'instagram' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Videos to return (1 to 50).',
      required: false,
      defaultValue: 50,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'The next_cursor from a previous call, to get the next page.',
      required: false,
    }),
  },
  async run(context) {
    const { query, platform, limit, cursor } = context.propsValue;
    return transcriptFetchRequest({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/api/v2/transcripts/search',
      body: compact({ query, platform: platform ?? 'youtube', limit: Math.min(Math.max(limit ?? 50, 1), 50), cursor }),
    });
  },
});
