import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlDeliveryZoneEntry,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';
import { listDeliveryZonesOutputSchema } from '../../output-schemas/fulfillment';

const MAX_PAGE_SIZE = 25;
const FETCH_PAGE_SIZE = 10;
const FIRST_ZONE_TOKEN = 'first';

export const shopifyAiListDeliveryZones = createAction({
  auth: shopifyAuth,
  name: 'list_delivery_zones',
  classification: 'SEARCH',
  displayName: 'List Delivery Zones',
  description: 'List every shipping zone of one location group in a delivery profile, with countries and rates.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists all shipping zones of one location group in one delivery (shipping) profile, each with its countries and up to 50 rates (name, flat price or carrier service). Use it when list_delivery_profiles reports zones_truncated or rates_truncated, or to read one group in full. Take profile_id and location_group_id from list_delivery_profiles. Paged, at most 10 zones per call even when first is larger: pass end_cursor back as the cursor while has_next_page is true. When a zone has rates_truncated, call again with the zone_token of that zone and rates_after set to its rates_end_cursor to read its next 50 rates (only that zone is returned). Needs the read_shipping access scope. Read-only.',
    idempotent: true,
  },
  outputSchema: listDeliveryZonesOutputSchema,
  props: {
    profile_id: Property.ShortText({
      displayName: 'Delivery Profile ID',
      description: 'The profile id from list_delivery_profiles, numeric or "gid://shopify/DeliveryProfile/…".',
      required: true,
    }),
    location_group_id: Property.ShortText({
      displayName: 'Location Group ID',
      description: 'The location_group_id from list_delivery_profiles, numeric or "gid://shopify/DeliveryLocationGroup/…".',
      required: true,
    }),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
    zone_token: Property.ShortText({
      displayName: 'Zone Token',
      description: 'To read more rates of one zone: that zone\'s zone_token from a previous call. Returns only that zone.',
      required: false,
    }),
    rates_after: Property.ShortText({
      displayName: 'Rates Cursor',
      description: 'With zone_token: the zone\'s rates_end_cursor from a previous call, to read its next 50 rates.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const profileId = shopifyGraphqlClient.toGid({ type: 'DeliveryProfile', id: propsValue.profile_id });
    const locationGroupId = shopifyGraphqlClient.toGid({
      type: 'DeliveryLocationGroup',
      id: propsValue.location_group_id,
    });
    const zoneToken = shopifyValues.nonEmpty(propsValue.zone_token);
    const ratesAfter = shopifyValues.nonEmpty(propsValue.rates_after);
    if (ratesAfter && !zoneToken) {
      throw new Error('Set zone_token together with rates_after, both from a previous call.');
    }
    const zonesAfter = zoneToken ? (zoneToken === FIRST_ZONE_TOKEN ? undefined : zoneToken) : shopifyValues.nonEmpty(propsValue.after);
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      deliveryProfile: {
        id: string;
        profileLocationGroups: {
          locationGroupZones?: {
            edges: { cursor: string; node: GqlDeliveryZoneEntry }[];
            pageInfo?: { hasNextPage?: boolean | null; endCursor?: string | null } | null;
          } | null;
        }[];
      } | null;
    }>({
      auth,
      query: `query ListDeliveryZones($id: ID!, $locationGroupId: ID!, $first: Int!, $after: String, $ratesAfter: String) { deliveryProfile(id: $id) { id profileLocationGroups(locationGroupId: $locationGroupId) { locationGroupZones(first: $first, after: $after) { edges { cursor node { ${shopifyFields.DELIVERY_ZONE_FIELDS} } } ${shopifyFields.PAGE_INFO_FIELDS} } } } }`,
      variables: {
        id: profileId,
        locationGroupId,
        first: zoneToken ? 1 : Math.min(shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }), FETCH_PAGE_SIZE),
        after: zonesAfter,
        ratesAfter,
      },
    });
    if (!data.deliveryProfile) {
      throw new Error(`Delivery profile ${profileId} was not found.`);
    }
    const group = data.deliveryProfile.profileLocationGroups[0];
    if (!group) {
      throw new Error(
        `Location group ${locationGroupId} is not part of delivery profile ${profileId}. Check both ids with list_delivery_profiles.`
      );
    }
    const edges = group.locationGroupZones?.edges ?? [];
    const items = edges.map((edge, index) => ({
      ...shopifyMappers.mapDeliveryZone(edge.node),
      rates_end_cursor: edge.node.methodDefinitions?.pageInfo?.endCursor ?? null,
      zone_token: index === 0 ? zonesAfter ?? FIRST_ZONE_TOKEN : edges[index - 1].cursor,
    }));
    return {
      profile_id: profileId,
      location_group_id: locationGroupId,
      items,
      count: items.length,
      has_next_page: zoneToken ? false : group.locationGroupZones?.pageInfo?.hasNextPage ?? false,
      end_cursor: zoneToken ? null : group.locationGroupZones?.pageInfo?.endCursor ?? null,
      redacted_fields: redactedFields,
    };
  },
});
