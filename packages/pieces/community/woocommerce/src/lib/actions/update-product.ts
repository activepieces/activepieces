import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

import { wooAuth } from '../auth';
import { updateProductOutputSchema } from '../output-schemas';

export const wooUpdateProduct = createAction({
  name: 'Update Product',
  classification: 'WRITE',
  displayName: 'Update Product',
  description: 'Update a product, for example its price or stock level',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates an existing WooCommerce product by ID. Commonly used to change price, sale price, stock quantity, or publish status. Only the fields provided are changed; everything else is left untouched. Idempotent: sending the same values twice leaves the product in the same state.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: updateProductOutputSchema,
  props: {
    id: Property.ShortText({
      displayName: 'Product ID',
      description: 'Enter the product ID',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    regular_price: Property.Number({
      displayName: 'Regular Price',
      required: false,
    }),
    sale_price: Property.Number({
      displayName: 'Sale Price',
      required: false,
    }),
    stock_quantity: Property.Number({
      displayName: 'Stock Quantity',
      description: 'Setting this also enables stock management',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Published', value: 'publish' },
          { label: 'Draft', value: 'draft' },
          { label: 'Pending', value: 'pending' },
          { label: 'Private', value: 'private' },
        ],
      },
    }),
    description: Property.LongText({
      displayName: 'Description',
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
      url: `${trimmedBaseUrl}/wp-json/wc/v3/products/${id}`,
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
