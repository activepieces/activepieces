import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlFulfillmentEvent,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';
import { listFulfillmentEventsOutputSchema } from '../../output-schemas/fulfillment';

const MAX_PAGE_SIZE = 250;

export const shopifyAiListFulfillmentEvents = createAction({
  auth: shopifyAuth,
  name: 'list_fulfillment_events',
  classification: 'SEARCH',
  displayName: 'List Fulfillment Events',
  description: 'List the tracking events recorded on a fulfillment.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the tracking events of one fulfillment (label printed, in transit, out for delivery, delivered, …) with message, time and place. Sorted by when they happened unless another sort is chosen. Paged: pass end_cursor back as the cursor while has_next_page is true. Needs the read_orders access scope. Read-only.',
    idempotent: true,
  },
  outputSchema: listFulfillmentEventsOutputSchema,
  props: {
    fulfillment_id: Property.ShortText({
      displayName: 'Fulfillment ID',
      description:
        'The fulfillment id, numeric or "gid://shopify/Fulfillment/…". Find it with list_order_fulfillments.',
      required: true,
    }),
    sort_key: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field to sort by. Defaults to when the event happened.',
      required: false,
      options: {
        options: [
          { label: 'Happened at', value: 'HAPPENED_AT' },
          { label: 'ID', value: 'ID' },
        ],
      },
    }),
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'Fulfillment', id: propsValue.fulfillment_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      fulfillment: { id: string; events?: GqlConnection<GqlFulfillmentEvent> | null } | null;
    }>({
      auth,
      query: `query ListFulfillmentEvents($id: ID!, $first: Int!, $after: String, $sortKey: FulfillmentEventSortKeys, $reverse: Boolean) { fulfillment(id: $id) { id events(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse) { nodes { ${shopifyFields.FULFILLMENT_EVENT_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } } }`,
      variables: {
        id,
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        sortKey: propsValue.sort_key ?? 'HAPPENED_AT',
        reverse: propsValue.reverse ?? false,
      },
      primaryPaths: ['fulfillment.events'],
    });
    if (!data.fulfillment) {
      throw new Error(`Fulfillment ${id} was not found.`);
    }
    return {
      fulfillment_id: data.fulfillment.id,
      ...shopifyMappers.toPage({
        connection: data.fulfillment.events,
        map: shopifyMappers.mapFulfillmentEvent,
        redactedFields,
      }),
    };
  },
});
