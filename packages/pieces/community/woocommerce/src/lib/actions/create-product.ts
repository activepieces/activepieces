import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  AuthenticationType,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

import { wooAuth } from '../auth';
import { createProductOutputSchema } from '../output-schemas';

export const wooCreateProduct = createAction({
  name: 'Create Product',
  classification: 'WRITE',
  displayName: 'Create Product',
  description: 'Add a new product to your store',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a new product in a WooCommerce store with a name, type (simple, grouped, external, or variable), regular price, descriptions, category IDs, and image URLs (categories and images are comma-separated lists). Use when an agent needs to add a catalog item. Not idempotent: each call creates a new product.',
    idempotent: false,
  },
  auth: wooAuth,
  outputSchema: createProductOutputSchema,
  propertyGroups: [
    {
      key: 'product',
      display: 'section',
      label: 'Product',
      icon: 'tag',
      props: ['name', 'type', 'regular_price'],
    },
    {
      key: 'details',
      display: 'section',
      label: 'Product Page',
      icon: 'text',
      props: ['description', 'short_description'],
    },
    {
      key: 'catalog',
      display: 'section',
      label: 'Catalog',
      icon: 'inbox',
      props: ['categories', 'images'],
    },
  ],
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Product name shown in your store.',
      placeholder: 'Blue T-Shirt',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Product Type',
      description: 'Simple suits most products sold as a single item.',
      required: true,
      display: 'cards',
      options: {
        options: [
          {
            label: 'Simple',
            value: 'simple',
            icon: 'tag',
          },
          {
            label: 'Grouped',
            value: 'grouped',
            icon: 'inbox',
          },
          {
            label: 'External',
            value: 'external',
            icon: 'send',
          },
          {
            label: 'Variable',
            value: 'variable',
            icon: 'sliders',
          },
        ],
      },
    }),
    regular_price: Property.Number({
      displayName: 'Regular Price',
      description:
        'Price before any sale. Leave empty for grouped and variable products.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Full description shown on the product page.',
      required: false,
    }),
    short_description: Property.LongText({
      displayName: 'Short Description',
      description: 'Summary shown next to the product image.',
      required: false,
    }),
    categories: Property.ShortText({
      displayName: 'Category IDs',
      description: 'Separate several IDs with commas.',
      placeholder: '12, 15',
      required: false,
    }),
    images: Property.LongText({
      displayName: 'Image URLs',
      description: 'Public image links, separated by commas.',
      placeholder: 'https://example.com/shirt.jpg',
      required: false,
    }),
  },
  async run(configValue) {
    const trimmedBaseUrl = configValue.auth.props.baseUrl.replace(/\/$/, '');

    const {
      name,
      type,
      regular_price,
      description,
      short_description,
      categories,
      images,
    } = configValue.propsValue;

    const body = {
      name,
      type,
      ...(regular_price === undefined || regular_price === null
        ? {}
        : { regular_price: String(regular_price) }),
      ...(hasText(description) ? { description } : {}),
      ...(hasText(short_description) ? { short_description } : {}),
      ...(hasText(categories)
        ? {
            categories: categories
              .split(',')
              .map((id) => id.trim())
              .filter((id) => id.length > 0)
              .map((id) => ({ id })),
          }
        : {}),
      ...(hasText(images)
        ? {
            images: images
              .split(',')
              .map((url) => url.trim())
              .filter((url) => url.length > 0)
              .map((src) => ({ src })),
          }
        : {}),
    };

    const request: HttpRequest = {
      url: `${trimmedBaseUrl}/wp-json/wc/v3/products`,
      method: HttpMethod.POST,
      authentication: {
        type: AuthenticationType.BASIC,
        username: configValue.auth.props.consumerKey,
        password: configValue.auth.props.consumerSecret,
      },
      body,
    };

    const res = await httpClient.sendRequest(request);

    return res.body;
  },
});

function hasText(value: string | null | undefined): value is string {
  return value !== undefined && value !== null && value.trim() !== '';
}
