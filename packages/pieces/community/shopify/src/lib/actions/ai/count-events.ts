import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { GqlCount, shopifyGraphqlClient, shopifyProps, shopifyValues } from '../../common/graphql';

export const shopifyAiCountEvents = createAction({
  auth: shopifyAuth,
  name: 'count_events',
  classification: 'READ',
  displayName: 'Count Store Events',
  description: 'Count store activity-log events, optionally filtered.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Counts store events (the activity log), optionally filtered with the same search syntax as list_events, for example "action:\'destroy\' AND subject_type:\'PRODUCT\'" or "created_at:>2026-09-01". Shopify stops counting at 10,000; precision is AT_LEAST when it did. No dedicated access scope is documented; the read scope of each subject type is expected to apply (not yet confirmed on a store). Read-only.',
    idempotent: true,
  },
  props: {
    query: shopifyProps.searchQuery(
      'Shopify event search syntax, for example "subject_type:\'ORDER\'" or "created_at:>2026-09-01". Leave empty to count all.'
    ),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      eventsCount: GqlCount | null;
    }>({
      auth,
      query: `query CountEvents($query: String) { eventsCount(query: $query) { count precision } }`,
      variables: { query: shopifyValues.nonEmpty(propsValue.query) },
    });
    return {
      count: data.eventsCount?.count ?? 0,
      precision: data.eventsCount?.precision ?? null,
      redacted_fields: redactedFields,
    };
  },
});
