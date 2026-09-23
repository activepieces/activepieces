import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { GqlJob, shopifyGraphqlClient, shopifyValues } from '../../common/graphql';

export const shopifyAiReorderProductMedia = createAction({
  auth: shopifyAuth,
  name: 'reorder_product_media',
  classification: 'WRITE',
  displayName: 'Start Product Media Reorder',
  description: 'Start moving product media to new positions (runs in the background).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Starts moving media of one product to new positions (0 is first). Shopify does the move in the background and returns only a job: poll get_job with job_id until done is true, then read the order with list_product_media. Starts a new job on every call.',
    idempotent: false,
  },
  props: {
    product_id: Property.ShortText({
      displayName: 'Product ID',
      description: 'The product id, numeric or "gid://shopify/Product/…".',
      required: true,
    }),
    moves: Property.Array({
      displayName: 'Moves',
      description: 'The media to move and their new zero-based positions.',
      required: true,
      properties: {
        media_id: Property.ShortText({
          displayName: 'Media ID',
          description: 'The media id, for example "gid://shopify/MediaImage/1072273219".',
          required: true,
        }),
        new_position: Property.Number({
          displayName: 'New Position',
          description: 'Zero-based position, 0 is the first (featured) media.',
          required: true,
        }),
      },
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'Product', id: propsValue.product_id });
    const moves = shopifyValues.readRecords(propsValue.moves).map((move) => {
      const mediaId = shopifyValues.readText(move['media_id']);
      const position = shopifyValues.readNumber(move['new_position']);
      if (!mediaId || position === undefined || !Number.isInteger(position) || position < 0) {
        throw new Error('Every move needs a media_id and a whole-number new_position of 0 or more.');
      }
      return { id: shopifyGraphqlClient.toGid({ type: 'MediaImage', id: mediaId }), newPosition: String(position) };
    });
    if (moves.length === 0) {
      throw new Error('Provide at least one move.');
    }
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      productReorderMedia: { job: GqlJob | null } | null;
    }>({
      auth,
      query: `mutation ReorderProductMedia($id: ID!, $moves: [MoveInput!]!) { productReorderMedia(id: $id, moves: $moves) { job { id done } mediaUserErrors { field message code } } }`,
      variables: { id, moves },
    });
    return {
      product_id: id,
      job_id: data.productReorderMedia?.job?.id ?? null,
      done: data.productReorderMedia?.job?.done ?? false,
      redacted_fields: redactedFields,
    };
  },
});
