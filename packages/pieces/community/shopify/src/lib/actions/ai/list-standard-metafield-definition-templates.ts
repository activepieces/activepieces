import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlStandardMetafieldTemplate,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

const MAX_PAGE_SIZE = 60;

export const shopifyAiListStandardMetafieldDefinitionTemplates = createAction({
  auth: shopifyAuth,
  name: 'list_standard_metafield_definition_templates',
  classification: 'SEARCH',
  displayName: 'List Standard Metafield Templates',
  description: 'List Shopify\'s standard metafield definition templates.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Shopify\'s ready-made standard metafield definitions (for example product subtitle, care guide or ingredients) with namespace, key, name, type, the owner types they apply to and their validations. exclude_activated Yes hides templates the store already uses. Paged: pass end_cursor back as the cursor while has_next_page is true. No access scope needed. Read-only.',
    idempotent: true,
  },
  props: {
    exclude_activated: shopifyProps.booleanChoice({
      displayName: 'Exclude Activated',
      description: 'Yes hides templates the store has already enabled. Leave empty to include them.',
    }),
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      standardMetafieldDefinitionTemplates: GqlConnection<GqlStandardMetafieldTemplate>;
    }>({
      auth,
      query: `query ListStandardMetafieldDefinitionTemplates($first: Int!, $after: String, $excludeActivated: Boolean, $reverse: Boolean) { standardMetafieldDefinitionTemplates(first: $first, after: $after, excludeActivated: $excludeActivated, reverse: $reverse) { nodes { ${shopifyFields.STANDARD_METAFIELD_TEMPLATE_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        excludeActivated: shopifyValues.toBooleanChoice(propsValue.exclude_activated),
        reverse: propsValue.reverse ?? false,
      },
    });
    return shopifyMappers.toPage({
      connection: data.standardMetafieldDefinitionTemplates,
      map: shopifyMappers.mapStandardMetafieldTemplate,
      redactedFields,
    });
  },
});
