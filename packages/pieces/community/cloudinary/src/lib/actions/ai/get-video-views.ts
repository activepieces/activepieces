import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiProps, aiResults } from '../../common/ai-props';
import { cloudinaryGetVideoViewsOutputSchema } from '../../output-schemas';

export const cloudinaryGetVideoViews = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_get_video_views',
  outputSchema: cloudinaryGetVideoViewsOutputSchema,
  displayName: 'Get Video Views',
  description: 'Gets video view analytics from the Cloudinary Video Player.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns individual video view events tracked by the Cloudinary Video Player (public ID, watch time, duration, country, OS, app, end time), optionally filtered with an expression such as `video_public_id=my_video` or `view_ended_at>2026-01-01`. Empty when no views were tracked. Pages with next_cursor.',
    idempotent: true,
  },
  props: {
    expression: Property.ShortText({
      displayName: 'Expression',
      description: 'Filter expression (e.g. "video_public_id=my_video").',
      required: false,
    }),
    sort_by: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Sort order. Defaults to most recent view first.',
      required: false,
      options: {
        options: [
          { label: 'Most recent first', value: '-view_ended_at' },
          { label: 'Oldest first', value: 'view_ended_at' },
          { label: 'Longest watch time first', value: '-view_watch_time' },
          { label: 'Longest video first', value: '-video_duration' },
        ],
      },
    }),
    max_results: aiProps.maxResults(),
    next_cursor: aiProps.nextCursor(),
  },
  async run({ auth, propsValue }) {
    const response: ViewList = await makeRequest(auth, HttpMethod.GET, '/video/analytics/views', undefined, {
      expression: propsValue.expression,
      sort_by: propsValue.sort_by,
      max_results: aiResults.clampMaxResults({ value: propsValue.max_results }),
      next_cursor: propsValue.next_cursor,
    });
    return { views: response.data, count: response.data.length, next_cursor: response.next_cursor ?? null };
  },
});

type ViewList = { data: Record<string, unknown>[]; next_cursor?: string };
