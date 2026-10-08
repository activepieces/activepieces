import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlBusinessEntity,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';
import { listBusinessEntitiesOutputSchema } from '../../output-schemas/store';

export const shopifyAiListBusinessEntities = createAction({
  auth: shopifyAuth,
  name: 'list_business_entities',
  classification: 'SEARCH',
  displayName: 'List Business Entities',
  description: 'List the legal entities the merchant operates the store through.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the store\'s business entities: the legal entities the merchant trades through (every store has one primary entity; more exist when the merchant sells through several legal entities in different countries). Each has its id, display and company name, primary and archived flags, legal entity id and address. Entity ids are passed through exactly as returned (they are not always numeric), so hand them to get_business_entity unchanged. Returns the full list in one call (no paging). The required access scope is not documented; availability on every plan is to be confirmed. Read-only.',
    idempotent: true,
  },
  props: {},
  outputSchema: listBusinessEntitiesOutputSchema,
  async run({ auth }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      businessEntities: GqlBusinessEntity[] | null;
    }>({
      auth,
      query: `query ListBusinessEntities { businessEntities { ${shopifyFields.BUSINESS_ENTITY_FIELDS} } }`,
    });
    const items = (data.businessEntities ?? []).map(shopifyMappers.mapBusinessEntity);
    return {
      items,
      count: items.length,
      redacted_fields: redactedFields,
    };
  },
});
