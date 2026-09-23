import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlLocation,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';

export const shopifyAiGetLocation = createAction({
  auth: shopifyAuth,
  name: 'get_location',
  classification: 'READ',
  displayName: 'Get Location',
  description: 'Get one store location with its address and capabilities.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one location by id: name, address, whether it is active, fulfills online orders, ships inventory, has stock or unfulfilled orders, and whether it can be deactivated or deleted. Use list_locations to find location ids. Needs the read_locations access scope. Read-only.',
    idempotent: true,
  },
  props: {
    location_id: Property.ShortText({
      displayName: 'Location ID',
      description: 'The location id, numeric or "gid://shopify/Location/…". Find it with list_locations.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'Location', id: propsValue.location_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      location: GqlLocation | null;
    }>({
      auth,
      query: `query GetLocation($id: ID!) { location(id: $id) { ${shopifyFields.LOCATION_FIELDS} } }`,
      variables: { id },
    });
    if (!data.location) {
      throw new Error(`Location ${id} was not found.`);
    }
    return {
      ...shopifyMappers.mapLocation(data.location),
      redacted_fields: redactedFields,
    };
  },
});
