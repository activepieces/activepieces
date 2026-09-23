import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlFulfillmentOrder,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiReleaseFulfillmentOrderHold = createAction({
  auth: shopifyAuth,
  name: 'release_fulfillment_order_hold',
  classification: 'WRITE',
  displayName: 'Release Fulfillment Order Hold',
  description: 'Release holds on a fulfillment order so it can be shipped.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Releases fulfillment holds on one fulfillment order and returns the fulfillment order. release_scope is required: LISTED_HOLDS releases only the hold ids you pass (recommended; get them from get_fulfillment_order holds[].id), ALL_HOLDS releases every hold on the fulfillment order, including holds placed by other apps or staff, which can let items ship too early. When the last hold is gone the fulfillment order becomes fulfillable again. Releasing holds that are already released leaves the same state (confirm at Tier-2). Needs the write_merchant_managed_fulfillment_orders access scope.',
    idempotent: true,
  },
  props: {
    fulfillment_order_id: Property.ShortText({
      displayName: 'Fulfillment Order ID',
      description:
        'The held fulfillment order, numeric or "gid://shopify/FulfillmentOrder/…". Find it with list_order_fulfillment_orders.',
      required: true,
    }),
    release_scope: Property.StaticDropdown({
      displayName: 'Release Scope',
      description: 'Release only the listed holds, or every hold on the fulfillment order.',
      required: true,
      options: {
        options: [
          { label: 'Only the listed holds', value: 'LISTED_HOLDS' },
          { label: 'All holds on the fulfillment order', value: 'ALL_HOLDS' },
        ],
      },
    }),
    hold_ids: Property.Array({
      displayName: 'Hold IDs',
      description:
        'The holds to release, for example "gid://shopify/FulfillmentHold/123". Required with LISTED_HOLDS, must be empty with ALL_HOLDS.',
      required: false,
    }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'Optional id from your own system that releases the hold.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'FulfillmentOrder', id: propsValue.fulfillment_order_id });
    const holdIds = shopifyValues.toGidList({ type: 'FulfillmentHold', value: propsValue.hold_ids });
    if (propsValue.release_scope === 'LISTED_HOLDS' && !holdIds) {
      throw new Error('release_scope LISTED_HOLDS needs at least one hold id. Nothing was changed.');
    }
    if (propsValue.release_scope === 'ALL_HOLDS' && holdIds) {
      throw new Error(
        'release_scope ALL_HOLDS releases every hold; leave hold_ids empty, or use LISTED_HOLDS. Nothing was changed.'
      );
    }
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      fulfillmentOrderReleaseHold: { fulfillmentOrder: GqlFulfillmentOrder | null } | null;
    }>({
      auth,
      query: `mutation ReleaseFulfillmentOrderHold($id: ID!, $holdIds: [ID!], $externalId: String) { fulfillmentOrderReleaseHold(id: $id, holdIds: $holdIds, externalId: $externalId) { fulfillmentOrder { ${shopifyFields.FULFILLMENT_ORDER_FIELDS} } userErrors { field message code } } }`,
      variables: {
        id,
        holdIds,
        externalId: shopifyValues.nonEmpty(propsValue.external_id),
      },
    });
    const fulfillmentOrder = data.fulfillmentOrderReleaseHold?.fulfillmentOrder;
    if (!fulfillmentOrder) {
      throw new Error('Shopify did not return the fulfillment order.');
    }
    return {
      ...shopifyMappers.mapFulfillmentOrder(fulfillmentOrder),
      released_hold_ids: holdIds ?? [],
      redacted_fields: redactedFields,
    };
  },
});
