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

export const shopifyAiUpdateProductFields = createAction({
  auth: shopifyAuth,
  name: 'update_product_fields',
  classification: 'WRITE',
  displayName: 'Update Product',
  description: 'Change the title, description, vendor, type, status, handle, tags, category, SEO or collections of a product.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes one product; fields left empty are not sent and keep their values, and variants, options and media are never touched. Sending tags replaces all tags, so use add_tags or remove_tags for single tags. Setting status to ACTIVE makes the product visible on its sales channels. Re-running with the same values is safe.',
    idempotent: true,
  },
  outputSchema: productDetailOutputSchema,
  props: {
    product_id: Property.ShortText({
      displayName: 'Product ID',
      description: 'The product id, numeric or "gid://shopify/Product/…". Find it with search_products.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New product title.',
      required: false,
    }),
    description_html: Property.LongText({
      displayName: 'Description (HTML)',
      description: 'New description, HTML allowed. Replaces the existing description.',
      required: false,
    }),
    vendor: Property.ShortText({
      displayName: 'Vendor',
      description: 'New vendor name.',
      required: false,
    }),
    product_type: Property.ShortText({
      displayName: 'Product Type',
      description: 'New product type.',
      required: false,
    }),
    status: shopifyProps.productStatus({
      description: 'New status. Leave empty to keep the current status.',
    }),
    handle: Property.ShortText({
      displayName: 'Handle',
      description: 'New URL handle, for example "organic-cotton-t-shirt".',
      required: false,
    }),
    redirect_new_handle: shopifyProps.booleanChoice({
      displayName: 'Redirect Old Handle',
      description: 'When changing the handle, create a redirect from the old URL. Leave empty for the Shopify default.',
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'The complete new tag list. Replaces every existing tag; leave empty to keep the current tags.',
      required: false,
    }),
    category_id: Property.ShortText({
      displayName: 'Category ID',
      description: 'New taxonomy category id, for example "gid://shopify/TaxonomyCategory/aa-1-13-8".',
      required: false,
    }),
    collections_to_join: Property.Array({
      displayName: 'Collections to Join',
      description: 'Collection ids to add the product to, numeric or "gid://shopify/Collection/…".',
      required: false,
    }),
    collections_to_leave: Property.Array({
      displayName: 'Collections to Leave',
      description: 'Collection ids to remove the product from.',
      required: false,
    }),
    seo_title: Property.ShortText({
      displayName: 'SEO Title',
      description: 'New page title for search engines.',
      required: false,
    }),
    seo_description: Property.LongText({
      displayName: 'SEO Description',
      description: 'New meta description for search engines.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'Product', id: propsValue.product_id });
    const tags = shopifyValues.readStringList(propsValue.tags);
    const seo = await shopifyValues.mergeSeo({
      auth,
      id,
      title: propsValue.seo_title,
      description: propsValue.seo_description,
    });
    const patch = shopifyValues.compact({
      title: shopifyValues.nonEmpty(propsValue.title),
      descriptionHtml: shopifyValues.nonEmpty(propsValue.description_html),
      vendor: shopifyValues.nonEmpty(propsValue.vendor),
      productType: shopifyValues.nonEmpty(propsValue.product_type),
      status: propsValue.status,
      handle: shopifyValues.nonEmpty(propsValue.handle),
      redirectNewHandle: shopifyValues.toBooleanChoice(propsValue.redirect_new_handle),
      tags: tags && tags.length > 0 ? tags : undefined,
      category: shopifyValues.toCategoryGid(propsValue.category_id),
      collectionsToJoin: shopifyValues.toGidList({ type: 'Collection', value: propsValue.collections_to_join }),
      collectionsToLeave: shopifyValues.toGidList({ type: 'Collection', value: propsValue.collections_to_leave }),
      seo,
    });
    if (Object.keys(patch).length === 0) {
      throw new Error('Provide at least one field to update.');
    }
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      productUpdate: { product: GqlProduct | null } | null;
    }>({
      auth,
      query: `mutation UpdateProductFields($product: ProductUpdateInput!) { productUpdate(product: $product) { product { ${shopifyFields.PRODUCT_DETAIL_FIELDS} } userErrors { field message } } }`,
      variables: { product: { id, ...patch } },
    });
    const product = data.productUpdate?.product;
    if (!product) {
      throw new Error(`Product ${id} was not returned by Shopify.`);
    }
    return {
      ...shopifyMappers.mapProductDetail(product),
      redacted_fields: redactedFields,
    };
  },
});
