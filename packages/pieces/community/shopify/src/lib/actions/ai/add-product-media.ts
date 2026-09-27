import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlMedia,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiAddProductMedia = createAction({
  auth: shopifyAuth,
  name: 'add_product_media',
  classification: 'WRITE',
  displayName: 'Add Product Media',
  description: 'Add images, videos or 3D models to a product from public URLs.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds media to a product from publicly reachable URLs (images, videos, YouTube or Vimeo links, 3D models). New media is appended after the existing media and is processed in the background: status starts as UPLOADED or PROCESSING and becomes READY later (check with list_product_media). Returns the newly added media items (the last ones by position, one per URL sent) with their new ids, however many media the product already had. Each call adds new copies, so retries create duplicates.',
    idempotent: false,
  },
  props: {
    product_id: Property.ShortText({
      displayName: 'Product ID',
      description: 'The product id, numeric or "gid://shopify/Product/…". Find it with search_products.',
      required: true,
    }),
    media: Property.Array({
      displayName: 'Media',
      description: 'The media to add, one entry per file.',
      required: true,
      properties: {
        url: Property.ShortText({
          displayName: 'URL',
          description: 'Public URL of the file, for example "https://example.com/shirt-front.jpg" or a YouTube link.',
          required: true,
        }),
        alt: Property.ShortText({
          displayName: 'Alt Text',
          description: 'Accessible description, for example "Red t-shirt, front view".',
          required: false,
        }),
        media_type: Property.StaticDropdown({
          displayName: 'Media Type',
          description: 'Kind of file. Defaults to image.',
          required: false,
          options: {
            options: [
              { label: 'Image', value: 'IMAGE' },
              { label: 'Video file', value: 'VIDEO' },
              { label: 'External video (YouTube, Vimeo)', value: 'EXTERNAL_VIDEO' },
              { label: '3D model', value: 'MODEL_3D' },
            ],
          },
        }),
      },
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'Product', id: propsValue.product_id });
    const media = shopifyValues.readRecords(propsValue.media).map((item) => {
      const url = shopifyValues.readText(item['url']);
      if (!url) {
        throw new Error('Every media entry needs a url.');
      }
      return shopifyValues.compact({
        originalSource: url,
        alt: shopifyValues.readText(item['alt']),
        mediaContentType: shopifyValues.readText(item['media_type']) ?? 'IMAGE',
      });
    });
    if (media.length === 0) {
      throw new Error('Provide at least one media URL.');
    }
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      productUpdate: { product: { id: string; media: GqlConnection<GqlMedia> } | null } | null;
    }>({
      auth,
      query: `mutation AddProductMedia($product: ProductUpdateInput!, $media: [CreateMediaInput!], $added: Int!) { productUpdate(product: $product, media: $media) { product { id media(first: $added, sortKey: POSITION, reverse: true) { nodes { ${shopifyFields.MEDIA_FIELDS} } } } userErrors { field message } } }`,
      variables: { product: { id }, media, added: media.length },
    });
    const items = [...(data.productUpdate?.product?.media?.nodes ?? [])].reverse().map(shopifyMappers.mapMedia);
    return {
      product_id: data.productUpdate?.product?.id ?? id,
      media: items,
      count: items.length,
      redacted_fields: redactedFields,
    };
  },
});
