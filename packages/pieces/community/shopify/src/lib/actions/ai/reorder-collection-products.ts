import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { GqlJob, shopifyGraphqlClient, shopifyValues } from '../../common/graphql';

export const shopifyAiReorderCollectionProducts = createAction({
  auth: shopifyAuth,
  name: 'reorder_collection_products',
  classification: 'WRITE',
  displayName: 'Start Collection Product Reorder',
  description: 'Start moving products to new positions inside a manually sorted collection (runs in the background).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Starts moving products to new zero-based positions inside one collection. The collection\'s sort order must be MANUAL (set it with update_collection first). Shopify does the move in the background and returns only a job: poll get_job with job_id until done is true, then read the order with list_collection_products. Starts a new job on every call.',
    idempotent: false,
  },
  props: {
    collection_id: Property.ShortText({
      displayName: 'Collection ID',
      description: 'The collection id, numeric or "gid://shopify/Collection/…".',
      required: true,
    }),
    moves: Property.Array({
      displayName: 'Moves',
      description: 'The products to move and their new zero-based positions.',
      required: true,
      properties: {
        product_id: Property.ShortText({
          displayName: 'Product ID',
          description: 'The product id, numeric or "gid://shopify/Product/…".',
          required: true,
        }),
        new_position: Property.Number({
          displayName: 'New Position',
          description: 'Zero-based position inside the collection, 0 is first.',
          required: true,
        }),
      },
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'Collection', id: propsValue.collection_id });
    const moves = shopifyValues.readRecords(propsValue.moves).map((move) => {
      const productId = shopifyValues.readText(move['product_id']);
      const position = shopifyValues.readNumber(move['new_position']);
      if (!productId || position === undefined || !Number.isInteger(position) || position < 0) {
        throw new Error('Every move needs a product_id and a whole-number new_position of 0 or more.');
      }
      return { id: shopifyGraphqlClient.toGid({ type: 'Product', id: productId }), newPosition: String(position) };
    });
    if (moves.length === 0) {
      throw new Error('Provide at least one move.');
    }
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      collectionReorderProducts: { job: GqlJob | null } | null;
    }>({
      auth,
      query: `mutation ReorderCollectionProducts($id: ID!, $moves: [MoveInput!]!) { collectionReorderProducts(id: $id, moves: $moves) { job { id done } userErrors { field message code } } }`,
      variables: { id, moves },
    });
    return {
      collection_id: id,
      job_id: data.collectionReorderProducts?.job?.id ?? null,
      done: data.collectionReorderProducts?.job?.done ?? false,
      redacted_fields: redactedFields,
    };
  },
});
