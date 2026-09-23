import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlMedia,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';

export const shopifyAiGetProductMedia = createAction({
  auth: shopifyAuth,
  name: 'get_product_media',
  classification: 'READ',
  displayName: 'Get Product Media',
  description: 'Get one product image, video or 3D model by id.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one media item by id: type, processing status, alt text, URL, size and any processing errors. Use list_product_media to find media ids. Read-only.',
    idempotent: true,
  },
  props: {
    media_id: Property.ShortText({
      displayName: 'Media ID',
      description:
        'The media id, for example "gid://shopify/MediaImage/1072273219". A bare number is treated as an image id. Find it with list_product_media.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'MediaImage', id: propsValue.media_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      node: GqlMedia | null;
    }>({
      auth,
      query: `query GetProductMedia($id: ID!) { node(id: $id) { ... on Media { ${shopifyFields.MEDIA_FIELDS} } } }`,
      variables: { id },
    });
    if (!data.node || !data.node.id) {
      throw new Error(`Media ${id} was not found.`);
    }
    return {
      ...shopifyMappers.mapMedia(data.node),
      redacted_fields: redactedFields,
    };
  },
});
