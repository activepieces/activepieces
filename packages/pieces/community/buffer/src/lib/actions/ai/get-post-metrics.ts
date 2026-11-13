import { createAction, Property } from '@activepieces/pieces-framework';
import { bufferAuth } from '../../common/auth';
import { bufferClient } from '../../common/client';
import { bufferAiProps } from '../../common/ai-props';
import { bufferQueries } from '../../common/queries';
import { getPostMetricsOutputSchema } from '../../common/output-schemas';

export const getPostMetrics = createAction({
  auth: bufferAuth,
  name: 'get_post_metrics',
  classification: 'READ',
  displayName: 'Get Post Metrics',
  description: 'Get totals and averages of post analytics over a date range.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds up analytics across the posts of one Buffer organization published in a date range (at most 365 days; on the Free plan the start must be within the last 31 days), optionally limited to channels or tags. Always returns postCount, reactions and comments; reach, impressions, engagement rate and others appear only when every included channel supports them. Metrics refresh about once a day; metricsUpdatedAt is empty when no post matched. For one post\'s numbers use Get a Post with Include Metrics. Read-only.',
    idempotent: true,
  },
  props: {
    organizationId: Property.ShortText({
      displayName: 'Organization ID',
      description: 'The organization ID from List Organizations.',
      required: true,
    }),
    startDateTime: Property.ShortText({
      displayName: 'From',
      description: 'Start of the window, inclusive, ISO 8601 with a timezone, e.g. 2026-10-01T00:00:00Z.',
      required: true,
    }),
    endDateTime: Property.ShortText({
      displayName: 'To',
      description: 'End of the window, inclusive, ISO 8601 with a timezone.',
      required: true,
    }),
    channelIds: Property.Array({
      displayName: 'Channel IDs',
      description: 'Only these channels (IDs from List Channels). Leave empty for every channel with insights.',
      required: false,
    }),
    tagIds: Property.Array({
      displayName: 'Tag IDs',
      description: 'Only posts carrying any of these tags (IDs from List Tags).',
      required: false,
    }),
  },
  outputSchema: getPostMetricsOutputSchema,
  async run(context) {
    const p = context.propsValue;
    const organizationId = bufferAiProps.requiredId({ value: p.organizationId, label: 'Organization ID' });
    const startDateTime = bufferAiProps.isoDate({ value: p.startDateTime, label: 'From', future: false });
    const endDateTime = bufferAiProps.isoDate({ value: p.endDateTime, label: 'To', future: false });
    if (startDateTime === undefined || endDateTime === undefined) {
      throw new Error('From and To are both required.');
    }
    if (Date.parse(startDateTime) > Date.parse(endDateTime)) {
      throw new Error('From must be earlier than To.');
    }
    const channelIds = bufferAiProps.idList({ value: p.channelIds, label: 'Channel IDs' });
    const tagIds = bufferAiProps.idList({ value: p.tagIds, label: 'Tag IDs' });

    const data = await bufferClient.graphql<{
      aggregatedPostMetrics: { metrics: Array<Record<string, unknown>>; metricsUpdatedAt?: string | null };
    }>({
      accessToken: context.auth.secret_text,
      query: bufferQueries.AGGREGATED_METRICS,
      variables: {
        input: {
          organizationId,
          startDateTime,
          endDateTime,
          ...(channelIds === undefined ? {} : { channelIds }),
          ...(tagIds === undefined ? {} : { tags: { in: tagIds } }),
        },
      },
      operation: 'load post metrics',
    });
    return {
      metrics: data.aggregatedPostMetrics.metrics,
      metricsUpdatedAt: data.aggregatedPostMetrics.metricsUpdatedAt ?? null,
    };
  },
});
