import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlBusinessEntity,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyValues,
} from '../../common/graphql';
import { businessEntityOutputSchema } from '../../output-schemas/store';

export const shopifyAiGetBusinessEntity = createAction({
  auth: shopifyAuth,
  name: 'get_business_entity',
  classification: 'READ',
  displayName: 'Get Business Entity',
  description: 'Get one business entity, or the primary one when no id is given.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one business entity (a legal entity the merchant trades through): names, primary and archived flags, legal entity id and address. Leave business_entity_id empty to get the store\'s primary entity. Pass the id exactly as list_business_entities returned it; non-numeric ids are sent unchanged. The required access scope is not documented; availability on every plan is to be confirmed. Read-only.',
    idempotent: true,
  },
  props: {
    business_entity_id: Property.ShortText({
      displayName: 'Business Entity ID',
      description: 'The entity id as returned by list_business_entities (a numeric id is read as "gid://shopify/BusinessEntity/…"). Leave empty for the primary entity.',
      required: false,
    }),
  },
  outputSchema: businessEntityOutputSchema,
  async run({ auth, propsValue }) {
    const rawId = shopifyValues.nonEmpty(propsValue.business_entity_id);
    const id = rawId ? shopifyGraphqlClient.toGid({ type: 'BusinessEntity', id: rawId }) : undefined;
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      businessEntity: GqlBusinessEntity | null;
    }>({
      auth,
      query: `query GetBusinessEntity($id: ID) { businessEntity(id: $id) { ${shopifyFields.BUSINESS_ENTITY_FIELDS} } }`,
      variables: shopifyValues.compact({ id }),
    });
    if (!data.businessEntity) {
      throw new Error(id ? `Business entity ${id} was not found.` : 'Shopify returned no primary business entity.');
    }
    return {
      ...shopifyMappers.mapBusinessEntity(data.businessEntity),
      redacted_fields: redactedFields,
    };
  },
});
