import { createAction, Property } from '@activepieces/pieces-framework';
import { buildPath, makeRequest } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { accountAnalyticsActionOutputSchema } from '../output-schemas';

export const getUserAccountAnalytics = createAction({
  auth: pinterestAuth,
  name: 'getUserAccountAnalytics',
  classification: 'READ',
  outputSchema: accountAnalyticsActionOutputSchema,
  displayName: 'Get Account Analytics',
  description: 'Read performance metrics for the whole account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reads profile-wide performance metrics over a date range, such as impressions, engagements, saves and outbound clicks. Use it for an account-level summary; use Get Pin Analytics for one Pin and Get Top Pins for a ranked list. Start and end date are required as YYYY-MM-DD and the range cannot start more than 90 days ago; unlike the Pin endpoint, metrics are optional here and Pinterest returns all of them when none are given. Read-only and idempotent.',
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
    metric_types: Property.StaticMultiSelectDropdown({
      displayName: 'Metrics',
      required: false,
      description: 'Leave empty to return every available metric.',
      options: {
        options: [
          { label: 'Engagement', value: 'ENGAGEMENT' },
          { label: 'Engagement Rate', value: 'ENGAGEMENT_RATE' },
          { label: 'Impressions', value: 'IMPRESSION' },
          { label: 'Outbound Clicks', value: 'OUTBOUND_CLICK' },
          { label: 'Outbound Click Rate', value: 'OUTBOUND_CLICK_RATE' },
          { label: 'Pin Clicks', value: 'PIN_CLICK' },
          { label: 'Pin Click Rate', value: 'PIN_CLICK_RATE' },
          { label: 'Saves', value: 'SAVE' },
          { label: 'Save Rate', value: 'SAVE_RATE' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { start_date, end_date, metric_types } = propsValue;

    return await makeRequest(
      getAccessTokenOrThrow(auth),
      HttpMethod.GET,
      buildPath('/user_account/analytics', {
        start_date,
        end_date,
        metric_types:
          metric_types === undefined || metric_types.length === 0
            ? undefined
            : metric_types.join(','),
      })
    );
  },
});
