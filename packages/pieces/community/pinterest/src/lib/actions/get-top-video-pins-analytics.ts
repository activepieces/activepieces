import { createAction, Property } from '@activepieces/pieces-framework';
import { buildPath, makeRequest } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { topPinsAnalyticsActionOutputSchema } from '../output-schemas';

export const getTopVideoPinsAnalytics = createAction({
  auth: pinterestAuth,
  name: 'getTopVideoPinsAnalytics',
  classification: 'READ',
  outputSchema: topPinsAnalyticsActionOutputSchema,
  displayName: 'Get Top Video Pins',
  description: 'Rank the account video Pins by a video metric.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the account best-performing video Pins over a date range, ranked by a video metric such as watch time or 10-second views. Use it for video content specifically; use Get Top Pins for all Pin formats ranked by engagement. Start date, end date and the sort metric are all required, dates are YYYY-MM-DD and the range cannot start more than 90 days ago. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    start_date: Property.ShortText({
      displayName: 'Start Date',
      required: true,
      description: 'YYYY-MM-DD, at most 90 days ago.',
    }),
    end_date: Property.ShortText({
      displayName: 'End Date',
      required: true,
      description: 'YYYY-MM-DD, at most 90 days after the start date.',
    }),
    sort_by: Property.StaticDropdown({
      displayName: 'Sort By',
      required: true,
      description: 'The video metric the ranking is based on.',
      options: {
        options: [
          { label: 'Saves', value: 'SAVE' },
          { label: 'Impressions', value: 'IMPRESSION' },
          { label: 'Outbound Clicks', value: 'OUTBOUND_CLICK' },
          { label: 'Video Views (MRC)', value: 'VIDEO_MRC_VIEW' },
          { label: 'Average Watch Time', value: 'VIDEO_AVG_WATCH_TIME' },
          { label: 'Total Play Time', value: 'VIDEO_V50_WATCH_TIME' },
          { label: '95% Quartile Views', value: 'QUARTILE_95_PERCENT_VIEW' },
          { label: 'Video 10s Views', value: 'VIDEO_10S_VIEW' },
          { label: 'Video Starts', value: 'VIDEO_START' },
        ],
      },
    }),
    num_of_pins: Property.Number({
      displayName: 'Number of Pins',
      required: false,
      description: 'How many Pins to return (1-50, Pinterest defaults to 10).',
    }),
    bookmark: Property.ShortText({
      displayName: 'Bookmark',
      required: false,
      description:
        'Opaque cursor returned by a previous call; omit to read the first page.',
    }),
  },
  async run({ auth, propsValue }) {
    const { start_date, end_date, sort_by, num_of_pins, bookmark } = propsValue;

    return await makeRequest(
      getAccessTokenOrThrow(auth),
      HttpMethod.GET,
      buildPath('/user_account/analytics/top_video_pins', {
        start_date,
        end_date,
        sort_by,
        num_of_pins,
        bookmark,
      })
    );
  },
});
