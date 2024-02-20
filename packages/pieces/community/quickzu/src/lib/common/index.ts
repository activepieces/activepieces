import { PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { quickzuAuth } from '../../';
import { QuickzuAPIClient } from './client';

export function makeClient(auth: PiecePropValueSchema<typeof quickzuAuth>) {
  const client = new QuickzuAPIClient(auth);
  return client;
}

export const quickzuCommon = {
  categoryId: (required = false) =>
    Property.Dropdown({
      displayName: 'Category',
      refreshers: [],
      required,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first.',
          };
        }
        const client = makeClient(auth as string);
        const res = await client.listCategories();

        return {
          disabled: false,
          options: res.data.map((category) => {
            return {
              label: category.name,
              value: category._id,
            };
          }),
        };
      },
    }),
  productId: (required = false) =>
    Property.Dropdown({
      displayName: 'Product',
      refreshers: [],
      required,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first.',
          };
        }
        const client = makeClient(auth as string);
        const res = await client.listProducts();

        return {
          disabled: false,
          options: res.data.map((product) => {
            return {
              label: product.name,
              value: product._id,
            };
          }),
        };
      },
    }),
  orderId: (required = false) =>
    Property.Dropdown<string>({
      displayName: 'Order',
      refreshers: [],
      required,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first.',
          };
        }
        const client = makeClient(auth as string);
        const res = await client.listOrders(1, 20);

        return {
          disabled: false,
          options: res['data'].map(
            (order: { _id: string; order_id: number }) => {
              return {
                label: order.order_id.toString(),
                value: order._id,
              };
            }
          ),
        };
      },
    }),
};
