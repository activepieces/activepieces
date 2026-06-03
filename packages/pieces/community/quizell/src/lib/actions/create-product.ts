import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { quizellAuth } from '../../';
import { quizellApiCall } from '../common/client';

export const createProduct = createAction({
  auth: quizellAuth,
  name: 'create_product',
  displayName: 'Create Product',
  description: 'Adds a new product to your Quizell product catalog.',
  props: {
    title: Property.ShortText({
      displayName: 'Product Title',
      description: 'The name of the product as it will appear in quiz recommendations.',
      required: true,
    }),
    price: Property.Number({
      displayName: 'Price',
      description: 'The selling price of the product (e.g. 29.99).',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Whether this product is active and visible in quizzes.',
      required: true,
      defaultValue: 1,
      options: {
        options: [
          { label: 'Active', value: 1 },
          { label: 'Inactive', value: 0 },
        ],
      },
    }),
    sku: Property.ShortText({
      displayName: 'SKU',
      description: 'Your internal stock keeping unit code for this product.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'A description of the product.',
      required: false,
    }),
    image: Property.ShortText({
      displayName: 'Image URL',
      description: 'A publicly accessible URL to the product image (e.g. https://example.com/product.jpg).',
      required: false,
    }),
    vendor: Property.ShortText({
      displayName: 'Vendor / Brand',
      description: 'The brand or vendor name for this product.',
      required: false,
    }),
    quantity: Property.Number({
      displayName: 'Quantity in Stock',
      description: 'The available quantity for this product.',
      required: false,
    }),
    compare_at_price: Property.Number({
      displayName: 'Compare-At Price',
      description: 'The original price to show a discount (e.g. 49.99). Leave empty if there is no sale.',
      required: false,
    }),
    tags: Property.ShortText({
      displayName: 'Tags',
      description: 'Comma-separated tags to categorize this product (e.g. "skincare, moisturizer, sensitive-skin").',
      required: false,
    }),
    detail_link: Property.ShortText({
      displayName: 'Product Page URL',
      description: 'The URL to the product page in your online store.',
      required: false,
    }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'The product ID from your external system (e.g. Shopify product ID) for syncing.',
      required: false,
    }),
  },
  async run(context) {
    const { title, price, status, sku, description, image, vendor, quantity, compare_at_price, tags, detail_link, external_id } = context.propsValue;

    const body: Record<string, unknown> = {
      title,
      price,
      status,
    };
    if (sku) body['sku'] = sku;
    if (description) body['description'] = description;
    if (image) body['image'] = image;
    if (vendor) body['vendor'] = vendor;
    if (quantity !== undefined && quantity !== null) body['quantity'] = quantity;
    if (compare_at_price !== undefined && compare_at_price !== null) body['compare_at_price'] = compare_at_price;
    if (tags) body['tags'] = tags.split(',').map((t) => t.trim());
    if (detail_link) body['detail_link'] = detail_link;
    if (external_id) body['external_id'] = external_id;

    const response = await quizellApiCall<{
      status: boolean;
      message: string;
      data: Record<string, unknown>;
    }>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/products/store',
      body,
    });

    const product = response.body.data;
    return {
      success: response.body.status,
      message: response.body.message,
      id: product['id'] ?? null,
      title: product['title'] ?? null,
      sku: product['sku'] ?? null,
      price: product['price'] ?? null,
      compare_at_price: product['compare_at_price'] ?? null,
      status: product['status'] === 1 ? 'active' : 'inactive',
      description: product['description'] ?? null,
      image: product['image'] ?? null,
      vendor: product['vendor'] ?? null,
      quantity: product['quantity'] ?? null,
      tags: Array.isArray(product['tags']) ? (product['tags'] as string[]).join(', ') : (product['tags'] ?? null),
      detail_link: product['detail_link'] ?? null,
      external_id: product['external_id'] ?? null,
      created_at: product['created_at'] ?? null,
    };
  },
});
