import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient, shopifyValues } from '../../common/graphql';
import { deleteProductMediaOutputSchema } from '../../output-schemas/products';

export const shopifyAiDeleteProductMedia = createAction({
  auth: shopifyAuth,
  name: 'delete_product_media',
  classification: 'DESTRUCTIVE',
  displayName: 'Remove Product Media',
  description: 'Remove images, videos or 3D models from a product.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Detaches media from a product: it disappears from the product gallery and from any variant that used it. The file itself stays in the store\'s Files library (it is not deleted there), except for media whose upload FAILED: Shopify cannot detach those, so they are deleted. Needs the write_files (or write_themes) access scope. Media ids come from list_product_media. A repeat call is not guaranteed to succeed once the media is detached.',
    idempotent: false,
  },
  outputSchema: deleteProductMediaOutputSchema,
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
    const { data: productData } = await shopifyGraphqlClient.request<{
      product: { media: { nodes: { id: string; status?: string | null }[] } } | null;
    }>({
      auth,
      query: `query ReadProductMediaStatus($id: ID!) { product(id: $id) { media(first: 250) { nodes { id status } } } }`,
      variables: { id: productId },
    });
    if (!productData.product) {
      throw new Error(`Product ${productId} was not found. Nothing was removed.`);
    }
    const productMedia = new Map(productData.product.media.nodes.map((node) => [node.id, node.status ?? null]));
    const foreignIds = mediaIds.filter((id) => !productMedia.has(id));
    if (foreignIds.length > 0) {
      throw new Error(
        `${foreignIds.join(', ')} ${foreignIds.length === 1 ? 'is' : 'are'} not media of product ${productId}. Check the ids with list_product_media. Nothing was removed.`
      );
    }
    const failedIds = new Set(mediaIds.filter((id) => productMedia.get(id) === 'FAILED'));
    const readyIds = mediaIds.filter((id) => !failedIds.has(id));
    const removedIds: (string | null)[] = [];
    const redacted: string[] = [];
    if (readyIds.length > 0) {
      const { data, redactedFields } = await shopifyGraphqlClient.request<{
        fileUpdate: { files: { id?: string | null }[] | null } | null;
      }>({
        auth,
        query: `mutation DeleteProductMedia($files: [FileUpdateInput!]!) { fileUpdate(files: $files) { files { id } userErrors { field message code } } }`,
        variables: {
          files: readyIds.map((id) => ({ id, referencesToRemove: [productId] })),
        },
      });
      removedIds.push(...(data.fileUpdate?.files ?? []).map((file) => file.id ?? null));
      redacted.push(...redactedFields);
    }
    if (failedIds.size > 0) {
      const { data, redactedFields } = await shopifyGraphqlClient.request<{
        fileDelete: { deletedFileIds: string[] | null } | null;
      }>({
        auth,
        query: `mutation DeleteFailedProductMedia($fileIds: [ID!]!) { fileDelete(fileIds: $fileIds) { deletedFileIds userErrors { field message code } } }`,
        variables: { fileIds: [...failedIds] },
      });
      removedIds.push(...(data.fileDelete?.deletedFileIds ?? []));
      redacted.push(...redactedFields);
    }
    return {
      product_id: productId,
      removed_media_ids: removedIds,
      redacted_fields: redacted,
    };
  },
});
