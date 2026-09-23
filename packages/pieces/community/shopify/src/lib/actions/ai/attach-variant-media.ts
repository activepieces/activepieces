import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { GqlVariant, shopifyGraphqlClient, shopifyValues } from '../../common/graphql';

export const shopifyAiAttachVariantMedia = createAction({
  auth: shopifyAuth,
  name: 'attach_variant_media',
  classification: 'WRITE',
  displayName: 'Attach Media to Variants',
  description: 'Show existing product media on specific variants (for example the red photo on the red variant).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Attaches media that already belongs to the product to one or more of its variants, so the storefront shows it when that variant is chosen. The media must first be added to the product (add_product_media) and be READY. Media ids come from list_product_media, variant ids from list_product_variants. Attaching the same media again leaves it attached.',
    idempotent: true,
  },
  props: {
    product_id: Property.ShortText({
      displayName: 'Product ID',
      description: 'The product id, numeric or "gid://shopify/Product/…".',
      required: true,
    }),
    variant_media: Property.Array({
      displayName: 'Variant Media',
      description: 'Which media to attach to which variant, one entry per pair.',
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
      productVariantAppendMedia: { productVariants: GqlVariant[] | null } | null;
    }>({
      auth,
      query: `mutation AttachVariantMedia($productId: ID!, $variantMedia: [ProductVariantAppendMediaInput!]!) { productVariantAppendMedia(productId: $productId, variantMedia: $variantMedia) { productVariants { id title media(first: 10) { nodes { id } } } userErrors { field message code } } }`,
      variables: { productId, variantMedia },
    });
    return {
      product_id: productId,
      variants: (data.productVariantAppendMedia?.productVariants ?? []).map((variant) => ({
        id: variant.id,
        title: variant.title ?? null,
        media_ids: (variant.media?.nodes ?? []).map((media) => media.id ?? null),
      })),
      redacted_fields: redactedFields,
    };
  },
});
