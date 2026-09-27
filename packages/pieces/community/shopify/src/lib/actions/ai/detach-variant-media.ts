import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { GqlVariant, shopifyGraphqlClient, shopifyValues } from '../../common/graphql';
import { variantMediaOutputSchema } from '../../output-schemas/products';

export const shopifyAiDetachVariantMedia = createAction({
  auth: shopifyAuth,
  name: 'detach_variant_media',
  classification: 'WRITE',
  displayName: 'Detach Media from Variants',
  description: 'Stop showing specific product media on specific variants.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Detaches media from one or more variants of a product. The media stays on the product itself; to remove it from the product use delete_product_media. Media ids come from list_product_media, variant ids from list_product_variants. Detaching again leaves it detached.',
    idempotent: true,
  },
  outputSchema: variantMediaOutputSchema,
  props: {
    product_id: Property.ShortText({
      displayName: 'Product ID',
      description: 'The product id, numeric or "gid://shopify/Product/…".',
      required: true,
    }),
    variant_media: Property.Array({
      displayName: 'Variant Media',
      description: 'Which media to detach from which variant, one entry per pair.',
      required: true,
      properties: {
        variant_id: Property.ShortText({
          displayName: 'Variant ID',
          description: 'The variant id, numeric or "gid://shopify/ProductVariant/…".',
          required: true,
        }),
        media_id: Property.ShortText({
          displayName: 'Media ID',
          description: 'The media id, for example "gid://shopify/MediaImage/1072273219".',
          required: true,
        }),
      },
    }),
  },
  async run({ auth, propsValue }) {
    const productId = shopifyGraphqlClient.toGid({ type: 'Product', id: propsValue.product_id });
    const variantMedia = shopifyValues.groupVariantMedia(propsValue.variant_media);
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      productVariantDetachMedia: { productVariants: GqlVariant[] | null } | null;
    }>({
      auth,
      query: `mutation DetachVariantMedia($productId: ID!, $variantMedia: [ProductVariantDetachMediaInput!]!) { productVariantDetachMedia(productId: $productId, variantMedia: $variantMedia) { productVariants { id title media(first: 10) { nodes { id } } } userErrors { field message code } } }`,
      variables: { productId, variantMedia },
    });
    return {
      product_id: productId,
      variants: (data.productVariantDetachMedia?.productVariants ?? []).map((variant) => ({
        id: variant.id,
        title: variant.title ?? null,
        media_ids: (variant.media?.nodes ?? []).map((media) => media.id ?? null),
      })),
      redacted_fields: redactedFields,
    };
  },
});
