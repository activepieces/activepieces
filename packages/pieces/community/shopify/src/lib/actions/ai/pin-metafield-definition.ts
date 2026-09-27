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
import { pinMetafieldDefinitionOutputSchema } from '../../output-schemas/content';

const ALREADY_PINNED = 'ALREADY_PINNED';

export const shopifyAiPinMetafieldDefinition = createAction({
  auth: shopifyAuth,
  name: 'pin_metafield_definition',
  classification: 'WRITE',
  displayName: 'Pin Metafield Definition',
  description: 'Pin a metafield definition so its field shows on the resource page in the Shopify admin.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Pins one metafield definition, identified by owner type, namespace and key, so its field appears on that resource\'s page in the Shopify admin (for example on every product page); returns the definition with its pinned_position. If the definition is already pinned, Shopify refuses the pin with ALREADY_PINNED; this action then reads the definition and returns it unchanged with already_pinned true, so repeating the call is safe and ends in the same state. Shopify limits how many definitions can be pinned per owner type and refuses beyond that (PINNED_LIMIT_REACHED). Needs the write access scope of the owner type (for example write_products).',
    idempotent: true,
  },
  outputSchema: pinMetafieldDefinitionOutputSchema,
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
    const namespace = shopifyValues.nonEmpty(propsValue.namespace);
    const key = shopifyValues.nonEmpty(propsValue.key);
    if (!propsValue.owner_type || !namespace || !key) {
      throw new Error('owner_type, namespace and key are all required. Nothing was changed.');
    }
    const identifier = { ownerType: propsValue.owner_type, namespace, key };
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      metafieldDefinitionPin: {
        pinnedDefinition?: GqlMetafieldDefinition | null;
        userErrors?: { code?: string | null }[] | null;
      } | null;
    }>({
      auth,
      query: `mutation PinMetafieldDefinition($identifier: MetafieldDefinitionIdentifierInput!) { metafieldDefinitionPin(identifier: $identifier) { pinnedDefinition { ${shopifyFields.METAFIELD_DEFINITION_FIELDS} } userErrors { field message code } } }`,
      variables: { identifier },
      toleratedUserErrorCodes: [ALREADY_PINNED],
    });
    const payload = data.metafieldDefinitionPin;
    if (payload?.pinnedDefinition) {
      return {
        ...shopifyMappers.mapMetafieldDefinition(payload.pinnedDefinition),
        already_pinned: false,
        redacted_fields: redactedFields,
      };
    }
    const alreadyPinned = (payload?.userErrors ?? []).some((error) => error.code === ALREADY_PINNED);
    if (!alreadyPinned) {
      throw new Error('Shopify did not return the pinned metafield definition.');
    }
    const current = await shopifyGraphqlClient.request<{
      metafieldDefinition: GqlMetafieldDefinition | null;
    }>({
      auth,
      query: `query GetMetafieldDefinition($identifier: MetafieldDefinitionIdentifierInput!) { metafieldDefinition(identifier: $identifier) { ${shopifyFields.METAFIELD_DEFINITION_FIELDS} } }`,
      variables: { identifier },
    });
    if (!current.data.metafieldDefinition) {
      throw new Error(
        `Shopify reported ${identifier.ownerType} metafield definition ${namespace}.${key} as already pinned, but it could not be read back. Use list_metafield_definitions to check it.`
      );
    }
    return {
      ...shopifyMappers.mapMetafieldDefinition(current.data.metafieldDefinition),
      already_pinned: true,
      redacted_fields: [...redactedFields, ...current.redactedFields],
    };
  },
});
