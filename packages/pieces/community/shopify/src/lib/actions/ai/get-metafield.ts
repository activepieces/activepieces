import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlMetafield,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';

export const shopifyAiGetMetafield = createAction({
  auth: shopifyAuth,
  name: 'get_metafield',
  classification: 'READ',
  displayName: 'Get Metafield',
  description: 'Get one metafield by its id.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one metafield by its id: namespace, key, type, value, compare_digest, owner type and owner id, and its definition. To read metafields by owner, namespace and key, use list_metafields instead. Needs the read access scope of the owner type (for example read_products). Read-only.',
    idempotent: true,
  },
  props: {
    metafield_id: Property.ShortText({
      displayName: 'Metafield ID',
      description: 'The metafield id, numeric or "gid://shopify/Metafield/…". Find it with list_metafields.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'Metafield', id: propsValue.metafield_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      node: (GqlMetafield & { __typename?: string }) | null;
    }>({
      auth,
      query: `query GetMetafield($id: ID!) { node(id: $id) { __typename ... on Metafield { ${shopifyFields.METAFIELD_FIELDS} } } }`,
      variables: { id },
    });
    if (!data.node || data.node.__typename !== 'Metafield') {
      throw new Error(`Metafield ${id} was not found.`);
    }
    return {
      ...shopifyMappers.mapMetafield(data.node),
      redacted_fields: redactedFields,
    };
  },
});
