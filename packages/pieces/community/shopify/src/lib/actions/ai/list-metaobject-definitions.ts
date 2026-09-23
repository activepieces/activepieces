import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlMetaobjectDefinition,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

const MAX_PAGE_SIZE = 30;

export const shopifyAiListMetaobjectDefinitions = createAction({
  auth: shopifyAuth,
  name: 'list_metaobject_definitions',
  classification: 'SEARCH',
  displayName: 'List Metaobject Definitions',
  description: 'List the store\'s metaobject types with their fields.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the store\'s metaobject definitions (custom content types such as "designer" or "shopify--color-pattern"): type, name, description, entry count, capabilities (publishable, translatable, renderable, online store), access and every field definition (key, name, type, required). Use it to learn the type and field keys for list_metaobjects and upsert_metaobject. Paged: pass end_cursor back as the cursor while has_next_page is true. Needs the read_metaobject_definitions access scope. Read-only.',
    idempotent: true,
  },
  props: {
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      metaobjectDefinitions: GqlConnection<GqlMetaobjectDefinition>;
    }>({
      auth,
      query: `query ListMetaobjectDefinitions($first: Int!, $after: String, $reverse: Boolean) { metaobjectDefinitions(first: $first, after: $after, reverse: $reverse) { nodes { ${shopifyFields.METAOBJECT_DEFINITION_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        reverse: propsValue.reverse ?? false,
      },
    });
    return shopifyMappers.toPage({
      connection: data.metaobjectDefinitions,
      map: shopifyMappers.mapMetaobjectDefinition,
      redactedFields,
    });
  },
});
