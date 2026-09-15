import { createAction, Property } from '@activepieces/pieces-framework';
import { buildPath, makeRequest } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { topPinsAnalyticsActionOutputSchema } from '../output-schemas';

export const getTopPinsAnalytics = createAction({
  auth: pinterestAuth,
  name: 'getTopPinsAnalytics',
  classification: 'READ',
  outputSchema: topPinsAnalyticsActionOutputSchema,
  displayName: 'Get Top Pins',
  description: 'Rank the account Pins by a performance metric.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the account best-performing Pins over a date range, ranked by the chosen metric. Use it to find what worked without pulling analytics for each Pin one by one; use Get Top Video Pins for video-specific rankings. Start date, end date and the sort metric are all required, dates are YYYY-MM-DD and the range cannot start more than 90 days ago. Read-only and idempotent.',
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
      description: 'The metric the ranking is based on.',
      options: {
        options: [
          { label: 'Engagement', value: 'ENGAGEMENT' },
          { label: 'Saves', value: 'SAVE' },
          { label: 'Impressions', value: 'IMPRESSION' },
          { label: 'Outbound Clicks', value: 'OUTBOUND_CLICK' },
          { label: 'Pin Clicks', value: 'PIN_CLICK' },
        ],
      },
    }),
    num_of_pins: Property.Number({
      displayName: 'Number of Pins',
      required: false,
      description: 'How many Pins to return (1-50, Pinterest defaults to 10).',
    }),
  },
  async run({ auth, propsValue }) {
    const { start_date, end_date, sort_by, num_of_pins } = propsValue;

    return await makeRequest(
      getAccessTokenOrThrow(auth),
      HttpMethod.GET,
      buildPath('/user_account/analytics/top_pins', {
        start_date,
        end_date,
        sort_by,
        num_of_pins,
      })
    );
  },
});
