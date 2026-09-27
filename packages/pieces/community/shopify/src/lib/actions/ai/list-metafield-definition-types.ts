import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlMetafieldDefinitionType,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';
import { listMetafieldDefinitionTypesOutputSchema } from '../../output-schemas/content';

export const shopifyAiListMetafieldDefinitionTypes = createAction({
  auth: shopifyAuth,
  name: 'list_metafield_definition_types',
  classification: 'SEARCH',
  displayName: 'List Metafield Types',
  description: 'List every metafield type Shopify supports, with its validations.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists every metafield type Shopify supports (for example single_line_text_field, number_integer, date, json, product_reference and their list.* variants) with its category and the validation rules it accepts. Use the name as the type in set_metafields, and the validation names in update_metafield_definition. Returns the full list in one call (no paging). No access scope needed. Read-only.',
    idempotent: true,
  },
  outputSchema: listMetafieldDefinitionTypesOutputSchema,
  props: {},
  async run({ auth }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      metafieldDefinitionTypes: GqlMetafieldDefinitionType[] | null;
    }>({
      auth,
      query: `query ListMetafieldDefinitionTypes { metafieldDefinitionTypes { ${shopifyFields.METAFIELD_DEFINITION_TYPE_FIELDS} } }`,
    });
    const items = (data.metafieldDefinitionTypes ?? []).map(shopifyMappers.mapMetafieldDefinitionType);
    return {
      items,
      count: items.length,
      redacted_fields: redactedFields,
    };
  },
});
