import { createAction, Property } from '@activepieces/pieces-framework';
import { buildPath, makeRequest } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { pinAnalyticsActionOutputSchema } from '../output-schemas';

const PIN_METRIC_OPTIONS = [
  { label: 'Impressions', value: 'IMPRESSION' },
  { label: 'Outbound Clicks', value: 'OUTBOUND_CLICK' },
  { label: 'Pin Clicks', value: 'PIN_CLICK' },
  { label: 'Saves', value: 'SAVE' },
  { label: 'Save Rate', value: 'SAVE_RATE' },
  { label: 'Total Comments', value: 'TOTAL_COMMENTS' },
  { label: 'Total Reactions', value: 'TOTAL_REACTIONS' },
  { label: 'User Follows', value: 'USER_FOLLOW' },
  { label: 'Profile Visits', value: 'PROFILE_VISIT' },
  { label: 'Video Views (MRC)', value: 'VIDEO_MRC_VIEW' },
  { label: 'Video 10s Views', value: 'VIDEO_10S_VIEW' },
  { label: '95% Quartile Views', value: 'QUARTILE_95_PERCENT_VIEW' },
  { label: 'Total Play Time', value: 'VIDEO_V50_WATCH_TIME' },
  { label: 'Video Starts', value: 'VIDEO_START' },
  { label: 'Average Watch Time', value: 'VIDEO_AVG_WATCH_TIME' },
];

export const getPinAnalytics = createAction({
  auth: pinterestAuth,
  name: 'getPinAnalytics',
  classification: 'READ',
  outputSchema: pinAnalyticsActionOutputSchema,
  displayName: 'Get Pin Analytics',
  description: 'Read performance metrics for a single Pin.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reads performance metrics for one Pin over a date range, such as impressions, saves, outbound clicks and video views. Use it to judge how a specific Pin performed; use Get Account Analytics for the whole profile and Get Top Pins for a ranked comparison. Start date, end date and at least one metric are all required, dates use YYYY-MM-DD, the range cannot start more than 90 days ago or span more than 90 days, and video metrics return zero on image Pins. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    pin_id: Property.ShortText({
      displayName: 'Pin ID',
      required: true,
      description: 'Numeric pin id, as returned by List Pins.',
    }),
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
      required: true,
      description: 'One or more metrics to return.',
      options: { options: PIN_METRIC_OPTIONS },
    }),
  },
  async run({ auth, propsValue }) {
    const { pin_id, start_date, end_date, metric_types } = propsValue;

    return await makeRequest(
      getAccessTokenOrThrow(auth),
      HttpMethod.GET,
      buildPath(`/pins/${pin_id}/analytics`, {
        start_date,
        end_date,
        metric_types: metric_types.join(','),
      })
    );
  },
});
