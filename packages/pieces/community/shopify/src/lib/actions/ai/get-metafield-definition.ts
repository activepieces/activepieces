import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlMetafieldDefinition,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';
import { metafieldDefinitionOutputSchema } from '../../output-schemas/content';

export const shopifyAiGetMetafieldDefinition = createAction({
  auth: shopifyAuth,
  name: 'get_metafield_definition',
  classification: 'READ',
  displayName: 'Get Metafield Definition',
  description: 'Get one metafield definition by owner type, namespace and key.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one metafield definition identified by owner type, namespace and key: name, type, description, validations (for example min, max, choices, regex), validation status, pinned position, access, capabilities and how many values exist. Read it before update_metafield_definition, because sending validations there replaces the whole list. Needs the read access scope of the owner type (for example read_products). Read-only.',
    idempotent: true,
  },
  outputSchema: metafieldDefinitionOutputSchema,
  props: {
    owner_type: shopifyProps.metafieldOwnerType({
      required: true,
      description: 'The resource type of the definition, for example PRODUCT.',
    }),
    namespace: Property.ShortText({
      displayName: 'Namespace',
      description: 'The definition namespace, for example "custom".',
      required: true,
    }),
    key: Property.ShortText({
      displayName: 'Key',
      description: 'The definition key, for example "care_instructions".',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const identifier = readIdentifier(propsValue);
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      metafieldDefinition: GqlMetafieldDefinition | null;
    }>({
      auth,
      query: `query GetMetafieldDefinition($identifier: MetafieldDefinitionIdentifierInput!) { metafieldDefinition(identifier: $identifier) { ${shopifyFields.METAFIELD_DEFINITION_FIELDS} } }`,
      variables: { identifier },
    });
    if (!data.metafieldDefinition) {
      throw new Error(
        `No ${identifier.ownerType} metafield definition ${identifier.namespace}.${identifier.key} was found. Use list_metafield_definitions to see the existing ones.`
      );
    }
    return {
      ...shopifyMappers.mapMetafieldDefinition(data.metafieldDefinition),
      redacted_fields: redactedFields,
    };
  },
});

function readIdentifier({
  owner_type,
  namespace,
  key,
}: {
  owner_type: string | undefined;
  namespace: string | undefined;
  key: string | undefined;
}) {
  const cleanNamespace = shopifyValues.nonEmpty(namespace);
  const cleanKey = shopifyValues.nonEmpty(key);
  if (!owner_type || !cleanNamespace || !cleanKey) {
    throw new Error('owner_type, namespace and key are all required.');
  }
  return { ownerType: owner_type, namespace: cleanNamespace, key: cleanKey };
}
