import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlMetafield,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';
import { listMetafieldsOutputSchema } from '../../output-schemas/content';

const MAX_PAGE_SIZE = 250;

export const shopifyAiListMetafields = createAction({
  auth: shopifyAuth,
  name: 'list_metafields',
  classification: 'SEARCH',
  displayName: 'List Metafields',
  description: 'List the metafields of one product, customer, order or other resource.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the metafields stored on one resource (product, variant, collection, customer, order, draft order, company, location, market, page, blog, article, the shop and more), each with namespace, key, type, value, compare_digest and its definition. Pass the owner\'s full id, for example "gid://shopify/Product/123" (use the shop id from get_shop for shop metafields); optionally only one namespace. Paged: pass end_cursor back as the cursor while has_next_page is true. Needs the read access scope of the owner type (for example read_products). Read-only.',
    idempotent: true,
  },
  outputSchema: listMetafieldsOutputSchema,
  props: {
    owner_id: Property.ShortText({
      displayName: 'Owner ID',
      description: 'Full id of the resource, for example "gid://shopify/Product/123" or "gid://shopify/Customer/456".',
      required: true,
    }),
    namespace: Property.ShortText({
      displayName: 'Namespace',
      description: 'Only return metafields in this namespace, for example "custom". Leave empty for all.',
      required: false,
    }),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const ownerId = shopifyValues.requireGid({
      value: propsValue.owner_id,
      label: 'owner_id',
      example: 'gid://shopify/Product/123',
      hint: 'the owner type cannot be guessed from a bare number.',
    });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      node: { id?: string | null; metafields?: GqlConnection<GqlMetafield> | null } | null;
    }>({
      auth,
      query: `query ListMetafields($id: ID!, $first: Int!, $after: String, $namespace: String) { node(id: $id) { id ... on HasMetafields { metafields(first: $first, after: $after, namespace: $namespace) { nodes { ${shopifyFields.METAFIELD_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } } } }`,
      variables: {
        id: ownerId,
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        namespace: shopifyValues.nonEmpty(propsValue.namespace),
      },
      primaryPaths: ['node.metafields'],
    });
    if (!data.node) {
      throw new Error(`Resource ${ownerId} was not found.`);
    }
    if (!data.node.metafields) {
      throw new Error(`Resource ${ownerId} cannot have metafields.`);
    }
    return {
      owner_id: ownerId,
      ...shopifyMappers.toPage({
        connection: data.node.metafields,
        map: shopifyMappers.mapMetafield,
        redactedFields,
      }),
    };
  },
});
