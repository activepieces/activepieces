import {
  createAction,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

import { wooAuth } from '../auth';
import { wooPathId } from '../common/path-id';
import { updateProductOutputSchema } from '../output-schemas';

export const wooUpdateProduct = createAction({
  name: 'Update Product',
  classification: 'WRITE',
  displayName: 'Update Product',
  description: 'Update a product, for example its price or stock level',
  audience: 'human',
  aiMetadata: {
    description:
      'Updates an existing WooCommerce product by ID. Commonly used to change price, sale price, stock quantity, or publish status. Only the fields provided are changed; everything else is left untouched. Idempotent: sending the same values twice leaves the product in the same state.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: updateProductOutputSchema,
  propertyGroups: [
    {
      key: 'product',
      display: 'section',
      label: 'Product to Update',
      icon: 'tag',
      props: ['id'],
    },
    {
      key: 'changes',
      display: 'section',
      label: 'Changes',
      icon: 'sliders',
      props: [
        'changes_info',
        'name',
        'regular_price',
        'sale_price',
        'stock_quantity',
        'status',
        'description',
      ],
    },
  ],
  props: {
    id: Property.ShortText({
      displayName: 'Product ID',
      description: 'Find it in WooCommerce under Products, next to each product.',
      placeholder: '123',
      required: true,
    }),
    changes_info: Property.MarkDown({
      value: 'Empty fields keep their current value.',
      variant: MarkdownVariant.INFO,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Product name shown in your store.',
      required: false,
    }),
    regular_price: Property.Number({
      displayName: 'Regular Price',
      description: 'Price before any sale.',
      required: false,
      width: 'half',
    }),
    sale_price: Property.Number({
      displayName: 'Sale Price',
      description: 'Discounted price shown instead of the regular one.',
      required: false,
      width: 'half',
    }),
    stock_quantity: Property.Number({
      displayName: 'Stock Quantity',
      description: 'Setting this also turns on stock tracking.',
      required: false,
      width: 'half',
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Who can see the product in your store.',
      required: false,
      width: 'half',
      options: {
        options: [
          { label: 'Published', value: 'publish' },
          { label: 'Draft', value: 'draft' },
          { label: 'Pending review', value: 'pending' },
          { label: 'Private', value: 'private' },
        ],
      },
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Full description shown on the product page.',
      required: false,
    }),
  },
  async run(configValue) {
    const trimmedBaseUrl = configValue.auth.props.baseUrl.replace(/\/$/, '');
    const { id, name, regular_price, sale_price, stock_quantity, status, description } =
      configValue.propsValue;

    const body: Record<string, unknown> = {};
    if (name) {
      body['name'] = name;
    }
    if (regular_price !== undefined && regular_price !== null) {
      body['regular_price'] = String(regular_price);
    }
    if (sale_price !== undefined && sale_price !== null) {
      body['sale_price'] = String(sale_price);
    }
    if (stock_quantity !== undefined && stock_quantity !== null) {
      body['manage_stock'] = true;
      body['stock_quantity'] = stock_quantity;
    }
    if (status) {
      body['status'] = status;
    }
    if (description) {
      body['description'] = description;
    }

    const request: HttpRequest = {
      method: HttpMethod.PUT,
      url: `${trimmedBaseUrl}/wp-json/wc/v3/products/${wooPathId.encode({ id, label: 'Product ID' })}`,
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
