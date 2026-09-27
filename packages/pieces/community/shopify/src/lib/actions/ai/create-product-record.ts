import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlProduct,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';
import { productDetailOutputSchema } from '../../output-schemas/products';

export const shopifyAiCreateProductRecord = createAction({
  auth: shopifyAuth,
  name: 'create_product_record',
  classification: 'WRITE',
  displayName: 'Create Product',
  description: 'Create a new product with its title, description, vendor, type, tags and status.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates one new product with a single default variant. The status defaults to DRAFT so nothing goes live by accident; pass ACTIVE to sell it. Add options and more variants afterwards with create_product_options and create_product_variants, images with add_product_media, and stock with the inventory actions; set_product builds a whole product with options and variants in one call. Each call creates another product, so retries create duplicates.',
    idempotent: false,
  },
  outputSchema: productDetailOutputSchema,
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Product title, for example "Organic Cotton T-Shirt".',
      required: true,
    }),
    description_html: Property.LongText({
      displayName: 'Description (HTML)',
      description: 'Product description, HTML allowed, for example "<p>Soft organic cotton.</p>".',
      required: false,
    }),
    vendor: Property.ShortText({
      displayName: 'Vendor',
      description: 'Brand or vendor name, for example "Acme Apparel".',
      required: false,
    }),
    product_type: Property.ShortText({
      displayName: 'Product Type',
      description: 'Merchant-defined product type, for example "T-Shirts".',
      required: false,
    }),
    status: shopifyProps.productStatus({
      description: 'Product status. Defaults to Draft (not visible to customers).',
    }),
    handle: Property.ShortText({
      displayName: 'Handle',
      description: 'URL handle, for example "organic-cotton-t-shirt". Generated from the title when empty.',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to add, for example ["summer", "cotton"].',
      required: false,
    }),
    category_id: Property.ShortText({
      displayName: 'Category ID',
      description: 'Standard product taxonomy category id, for example "gid://shopify/TaxonomyCategory/aa-1-13-8". Find it with search_product_taxonomy.',
      required: false,
    }),
    collection_ids: Property.Array({
      displayName: 'Collection IDs',
      description: 'Collections to add the product to, numeric or "gid://shopify/Collection/…".',
      required: false,
    }),
    seo_title: Property.ShortText({
      displayName: 'SEO Title',
      description: 'Page title for search engines.',
      required: false,
    }),
    seo_description: Property.LongText({
      displayName: 'SEO Description',
      description: 'Meta description for search engines.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const tags = shopifyValues.readStringList(propsValue.tags);
    const product = shopifyValues.compact({
      title: propsValue.title,
      descriptionHtml: shopifyValues.nonEmpty(propsValue.description_html),
      vendor: shopifyValues.nonEmpty(propsValue.vendor),
      productType: shopifyValues.nonEmpty(propsValue.product_type),
      status: propsValue.status ?? 'DRAFT',
      handle: shopifyValues.nonEmpty(propsValue.handle),
      tags: tags && tags.length > 0 ? tags : undefined,
      category: shopifyValues.toCategoryGid(propsValue.category_id),
      collectionsToJoin: shopifyValues.toGidList({ type: 'Collection', value: propsValue.collection_ids }),
      seo: shopifyValues.toSeo({ title: propsValue.seo_title, description: propsValue.seo_description }),
    });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      productCreate: { product: GqlProduct | null } | null;
    }>({
      auth,
      query: `mutation CreateProductRecord($product: ProductCreateInput!) { productCreate(product: $product) { product { ${shopifyFields.PRODUCT_DETAIL_FIELDS} } userErrors { field message } } }`,
      variables: { product },
    });
    const created = data.productCreate?.product;
    if (!created) {
      throw new Error('Shopify did not return the new product.');
    }
    return {
      ...shopifyMappers.mapProductDetail(created),
      redacted_fields: redactedFields,
    };
  },
});
