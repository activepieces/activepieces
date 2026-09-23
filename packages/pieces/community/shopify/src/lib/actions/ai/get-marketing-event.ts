import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlMarketingEvent,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';

export const shopifyAiGetMarketingEvent = createAction({
  auth: shopifyAuth,
  name: 'get_marketing_event',
  classification: 'READ',
  displayName: 'Get Marketing Event',
  description: 'Get one marketing event by id.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one marketing event: its tactic, channel, remote id, UTM values, start/end times, manage and preview URLs and the app it belongs to. Shopify documents marketing events as tied to the marketing app, so a custom-app token may only be able to read events it created itself (confirm on the store); another app\'s event can come back as not found. Find ids with list_marketing_events. Needs the read_marketing_events access scope. Read-only.',
    idempotent: true,
  },
  props: {
    marketing_event_id: Property.ShortText({
      displayName: 'Marketing Event ID',
      description: 'The marketing event id, numeric or "gid://shopify/MarketingEvent/…". Find it with list_marketing_events.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'MarketingEvent', id: propsValue.marketing_event_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      marketingEvent: GqlMarketingEvent | null;
    }>({
      auth,
      query: `query GetMarketingEvent($id: ID!) { marketingEvent(id: $id) { ${shopifyFields.MARKETING_EVENT_FIELDS} } }`,
      variables: { id },
    });
    if (!data.marketingEvent) {
      throw new Error(`Marketing event ${id} was not found, or it belongs to another app.`);
    }
    return {
      ...shopifyMappers.mapMarketingEvent(data.marketingEvent),
      redacted_fields: redactedFields,
    };
  },
});
