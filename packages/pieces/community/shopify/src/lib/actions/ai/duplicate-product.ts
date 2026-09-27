import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlJob,
  GqlProduct,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
} from '../../common/graphql';
import { duplicateProductOutputSchema } from '../../output-schemas/products';

export const shopifyAiDuplicateProduct = createAction({
  auth: shopifyAuth,
  name: 'duplicate_product',
  classification: 'WRITE',
  displayName: 'Duplicate Product',
  description: 'Create a copy of a product under a new title.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Copies one product (options, variants, prices, tags) into a new product with the given title and returns the new product. Images are copied only when include_images is on; that copy runs in the background and its image_job_id is polled with get_job. The copy keeps the original status unless new_status is set. Very large products may time out. Each call creates another copy, so retries create duplicates.',
    idempotent: false,
  },
  outputSchema: duplicateProductOutputSchema,
  props: {
    product_id: Property.ShortText({
      displayName: 'Product ID',
      description: 'The product to copy, numeric or "gid://shopify/Product/…". Find it with search_products.',
      required: true,
    }),
    new_title: Property.ShortText({
      displayName: 'New Title',
      description: 'Title of the copy, for example "Organic Cotton T-Shirt (Copy)".',
      required: true,
    }),
    new_status: shopifyProps.productStatus({
      description: 'Status of the copy. Leave empty to keep the status of the original.',
    }),
    include_images: Property.Checkbox({
      displayName: 'Copy Images',
      description: 'Also copy the product images (runs in the background). Off by default.',
      required: false,
      defaultValue: false,
    }),
    include_translations: Property.Checkbox({
      displayName: 'Copy Translations',
      description: 'Also copy the product translations. Off by default.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const productId = shopifyGraphqlClient.toGid({ type: 'Product', id: propsValue.product_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      productDuplicate: { newProduct: GqlProduct | null; imageJob: GqlJob | null } | null;
    }>({
      auth,
      query: `mutation DuplicateProduct($productId: ID!, $newTitle: String!, $newStatus: ProductStatus, $includeImages: Boolean, $includeTranslations: Boolean) { productDuplicate(productId: $productId, newTitle: $newTitle, newStatus: $newStatus, includeImages: $includeImages, includeTranslations: $includeTranslations, synchronous: true) { newProduct { ${shopifyFields.PRODUCT_DETAIL_FIELDS} } imageJob { id done } userErrors { field message } } }`,
      variables: {
        productId,
        newTitle: propsValue.new_title,
        newStatus: propsValue.new_status,
        includeImages: propsValue.include_images ?? false,
        includeTranslations: propsValue.include_translations ?? false,
      },
    });
    const newProduct = data.productDuplicate?.newProduct;
    if (!newProduct) {
      throw new Error('Shopify did not return the duplicated product.');
    }
    return {
      ...shopifyMappers.mapProductDetail(newProduct),
      source_product_id: productId,
      image_job_id: data.productDuplicate?.imageJob?.id ?? null,
      image_job_done: data.productDuplicate?.imageJob?.done ?? null,
      redacted_fields: redactedFields,
    };
  },
});
