import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlCollection,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';
import { collectionOutputSchema } from '../../output-schemas/products';

export const shopifyAiGetCollection = createAction({
  auth: shopifyAuth,
  name: 'get_collection',
  classification: 'READ',
  displayName: 'Get Collection',
  description: 'Get one collection with its membership sources and conditions.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one collection by id: title, handle, description, product sort order, product count, image, SEO and its membership sources. A conditions source holds the rule conditions (each with id, kind, relation, values and, for prices, currency_code) and the manually selected products (the first 25, with selected_products_truncated=true when there are more; list_collection_products lists every member). A source with shareable=true is reused by other collections and is never changed by add_products_to_collection or remove_products_from_collection. The source id and condition ids are what update_collection, add_products_to_collection and remove_products_from_collection work with. Use search_collections to find a collection first. Read-only.',
    idempotent: true,
  },
  outputSchema: collectionOutputSchema,
  props: {
    collection_id: Property.ShortText({
      displayName: 'Collection ID',
      description: 'The collection id, numeric or "gid://shopify/Collection/…". Find it with search_collections.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'Collection', id: propsValue.collection_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      collection: GqlCollection | null;
    }>({
      auth,
      query: `query GetCollection($id: ID!) { collection(id: $id) { ${shopifyFields.COLLECTION_FIELDS} } }`,
      variables: { id },
    });
    if (!data.collection) {
      throw new Error(`Collection ${id} was not found.`);
    }
    return {
      ...shopifyMappers.mapCollection(data.collection),
      redacted_fields: redactedFields,
    };
  },
});
