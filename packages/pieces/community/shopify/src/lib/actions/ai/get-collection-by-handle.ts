import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlCollection,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';

export const shopifyAiGetCollectionByHandle = createAction({
  auth: shopifyAuth,
  name: 'get_collection_by_handle',
  classification: 'READ',
  displayName: 'Get Collection by Handle',
  description: 'Get one collection by its URL handle.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one collection by its URL handle (the last part of /collections/<handle>), with the same fields as get_collection. Fails when no collection has that handle. Read-only.',
    idempotent: true,
  },
  props: {
    handle: Property.ShortText({
      displayName: 'Handle',
      description: 'The collection handle, for example "summer-sale".',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const handle = propsValue.handle.trim();
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      collectionByIdentifier: GqlCollection | null;
    }>({
      auth,
      query: `query GetCollectionByHandle($identifier: CollectionIdentifierInput!) { collectionByIdentifier(identifier: $identifier) { ${shopifyFields.COLLECTION_FIELDS} } }`,
      variables: { identifier: { handle } },
    });
    if (!data.collectionByIdentifier) {
      throw new Error(`No collection has the handle "${handle}".`);
    }
    return {
      ...shopifyMappers.mapCollection(data.collectionByIdentifier),
      redacted_fields: redactedFields,
    };
  },
});
