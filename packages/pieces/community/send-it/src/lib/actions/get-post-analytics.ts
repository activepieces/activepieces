import { createAction, Property } from '@activepieces/pieces-framework';
import { sendItAuth } from '../common/auth';
import { apiKeyOf } from '../common/client';
import { sendItOutputSchemas } from '../common/output-schemas';
import { singlePlatformProperty } from '../common/props';
import { sendItRequests, validateLimit } from '../common/requests';

export const getPostAnalytics = createAction({
  auth: sendItAuth,
  name: 'get_post_analytics',
  classification: 'SEARCH',
  displayName: 'Get Post Analytics',
  description: 'Get engagement metrics for posts published on one platform',
  audience: 'both',
  aiMetadata: {
    description:
      'Gets per-post engagement metrics SendIt collected for one platform (lowercase platform value such as instagram, linkedin, bluesky), optionally between startDate and endDate (ISO-8601). X analytics are disabled by SendIt (pay-per-use read charges) and return an error. posts is empty when nothing was published in the range. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    platform: { ...singlePlatformProperty, description: 'Platform to get analytics for. SendIt disables analytics for X.' },
    startDate: Property.DateTime({ displayName: 'Start Date', description: 'Only posts published on or after this date.', required: false }),
    endDate: Property.DateTime({ displayName: 'End Date', description: 'Only posts published on or before this date.', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: 'Maximum number of posts (1-100).', required: false }),
  },
  outputSchema: sendItOutputSchemas.analytics,
  async run(context) {
    const { platform, startDate, endDate, limit } = context.propsValue;
    return sendItRequests.analytics({ apiKey: apiKeyOf(context.auth), platform, startDate, endDate, limit: validateLimit({ value: limit, label: 'Limit', max: 100 }) });
  },
});
