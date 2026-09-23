import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient, shopifyValues } from '../../common/graphql';

export const shopifyAiDeleteProductMedia = createAction({
  auth: shopifyAuth,
  name: 'delete_product_media',
  classification: 'DESTRUCTIVE',
  displayName: 'Remove Product Media',
  description: 'Remove images, videos or 3D models from a product.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Detaches media from a product: it disappears from the product gallery and from any variant that used it. The file itself stays in the store\'s Files library (it is not deleted there). Needs the write_files (or write_themes) access scope. Media ids come from list_product_media. A repeat call is not guaranteed to succeed once the media is detached.',
    idempotent: false,
  },
  props: {
    product_id: Property.ShortText({
      displayName: 'Product ID',
      description: 'The product to remove the media from, numeric or "gid://shopify/Product/…".',
      required: true,
    }),
    media_ids: Property.Array({
      displayName: 'Media IDs',
      description: 'Ids of the media to remove, for example ["gid://shopify/MediaImage/1072273219"].',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const productId = shopifyGraphqlClient.toGid({ type: 'Product', id: propsValue.product_id });
    const mediaIds = shopifyValues.toGidList({ type: 'MediaImage', value: propsValue.media_ids });
    if (!mediaIds) {
      throw new Error('Provide at least one media id to remove.');
    }
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      fileUpdate: { files: { id?: string | null }[] | null } | null;
    }>({
      auth,
      query: `mutation DeleteProductMedia($files: [FileUpdateInput!]!) { fileUpdate(files: $files) { files { id } userErrors { field message code } } }`,
      variables: {
        files: mediaIds.map((id) => ({ id, referencesToRemove: [productId] })),
      },
    });
    return {
      product_id: productId,
      removed_media_ids: (data.fileUpdate?.files ?? []).map((file) => file.id ?? null),
      redacted_fields: redactedFields,
    };
  },
});
