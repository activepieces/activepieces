import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlMetaobjectDefinition,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiEnableStandardMetaobjectDefinition = createAction({
  auth: shopifyAuth,
  name: 'enable_standard_metaobject_definition',
  classification: 'WRITE',
  displayName: 'Enable Standard Metaobject Definition',
  description: 'Add one of Shopify\'s standard metaobject types to the store.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Enables one of Shopify\'s standard metaobject definitions from its template by type (for example "shopify--color-pattern"), creating that content type with its standard fields, and returns the new definition. Shopify refuses a type that is already enabled, so check list_metaobject_definitions first rather than retrying. Needs the write_metaobject_definitions access scope.',
    idempotent: false,
  },
  props: {
    type: Property.ShortText({
      displayName: 'Standard Type',
      description: 'The standard metaobject type to enable, for example "shopify--color-pattern".',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const type = shopifyValues.nonEmpty(propsValue.type);
    if (!type) {
      throw new Error('A standard metaobject type is required, for example "shopify--color-pattern". Nothing was changed.');
    }
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      standardMetaobjectDefinitionEnable: { metaobjectDefinition: GqlMetaobjectDefinition | null } | null;
    }>({
      auth,
      query: `mutation EnableStandardMetaobjectDefinition($type: String!) { standardMetaobjectDefinitionEnable(type: $type) { metaobjectDefinition { ${shopifyFields.METAOBJECT_DEFINITION_FIELDS} } userErrors { field message code } } }`,
      variables: { type },
    });
    const definition = data.standardMetaobjectDefinitionEnable?.metaobjectDefinition;
    if (!definition) {
      throw new Error('Shopify did not return the enabled metaobject definition.');
    }
    return {
      ...shopifyMappers.mapMetaobjectDefinition(definition),
      redacted_fields: redactedFields,
    };
  },
});
