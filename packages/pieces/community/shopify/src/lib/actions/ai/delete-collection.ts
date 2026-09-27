import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient } from '../../common/graphql';
import { deleteCollectionOutputSchema } from '../../output-schemas/products';

export const shopifyAiDeleteCollection = createAction({
  auth: shopifyAuth,
  name: 'delete_collection',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Collection',
  description: 'Permanently delete a collection. The products in it are not deleted.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one collection (manual or rule-based) and its membership rules. The products themselves are kept. Cannot be undone; a repeat call fails because the collection is gone.',
    idempotent: false,
  },
  outputSchema: deleteCollectionOutputSchema,
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
      collectionDelete: { deletedCollectionId?: string | null } | null;
    }>({
      auth,
      query: `mutation DeleteCollection($input: CollectionDeleteInput!) { collectionDelete(input: $input) { deletedCollectionId userErrors { field message } } }`,
      variables: { input: { id } },
    });
    return {
      deleted_collection_id: data.collectionDelete?.deletedCollectionId ?? id,
      redacted_fields: redactedFields,
    };
  },
});
