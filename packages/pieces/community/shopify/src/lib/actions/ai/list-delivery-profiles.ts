import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlDeliveryProfile,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';
import { listDeliveryProfilesOutputSchema } from '../../output-schemas/fulfillment';

const MAX_PAGE_SIZE = 1;

export const shopifyAiListDeliveryProfiles = createAction({
  auth: shopifyAuth,
  name: 'list_delivery_profiles',
  classification: 'SEARCH',
  displayName: 'List Delivery Profiles',
  description: 'List the shipping profiles with their zones, countries and rates.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the store\'s delivery (shipping) profiles: name, whether it is the default profile, how many variants it covers, and per location group the shipping zones with their countries and up to 3 rates each (name, flat price or carrier service). Up to 2 zones per location group are returned; zones_truncated and rates_truncated tell when there are more; then read that location group in full with list_delivery_zones. This is the GraphQL form of the old shipping zones. Returns one profile per call to stay within the Shopify query cost limit: pass end_cursor back as the cursor while has_next_page is true to read the next profile. Needs the read_shipping access scope. Read-only.',
    idempotent: true,
  },
  outputSchema: listDeliveryProfilesOutputSchema,
  props: {
    merchant_owned_only: Property.Checkbox({
      displayName: 'Merchant Owned Only',
      description: 'Return only profiles created by the merchant, not by apps. Off by default.',
      required: false,
      defaultValue: false,
    }),
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      deliveryProfiles: GqlConnection<GqlDeliveryProfile>;
    }>({
      auth,
      query: `query ListDeliveryProfiles($first: Int!, $after: String, $reverse: Boolean, $merchantOwnedOnly: Boolean) { deliveryProfiles(first: $first, after: $after, reverse: $reverse, merchantOwnedOnly: $merchantOwnedOnly) { nodes { ${shopifyFields.DELIVERY_PROFILE_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        reverse: propsValue.reverse ?? false,
        merchantOwnedOnly: propsValue.merchant_owned_only ?? false,
      },
    });
    return shopifyMappers.toPage({
      connection: data.deliveryProfiles,
      map: shopifyMappers.mapDeliveryProfile,
      redactedFields,
    });
  },
});
