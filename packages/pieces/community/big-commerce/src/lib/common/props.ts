import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendBigCommerceRequest, BigCommerceAuth } from './auth';

export const bigCommerceCommon = {
  product_id: Property.Dropdown({
    displayName: 'Product',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your BigCommerce account',
        };
      }

      try {
        const response = await sendBigCommerceRequest<{
          data: Array<{ id: number; name: string }>;
        }>({
          auth: auth as BigCommerceAuth,
          method: HttpMethod.GET,
          url: '/catalog/products',
          queryParams: {
            limit: '250',
          },
        });

        const products = response.body.data || [];
        return {
          disabled: false,
          options: products.map((product) => ({
            label: product.name,
            value: product.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load products',
        };
      }
    },
  }),

  customer_id: Property.Dropdown({
    displayName: 'Customer',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your BigCommerce account',
        };
      }

      try {
        const response = await sendBigCommerceRequest<{
          data: Array<{ id: number; email: string; first_name: string; last_name: string }>;
        }>({
          auth: auth as BigCommerceAuth,
          method: HttpMethod.GET,
          url: '/customers',
          queryParams: {
            limit: '250',
          },
        });

        const customers = response.body.data || [];
        return {
          disabled: false,
          options: customers.map((customer) => ({
            label: `${customer.first_name} ${customer.last_name} (${customer.email})`,
            value: customer.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load customers',
        };
      }
    },
  }),

  order_id: Property.Dropdown({
    displayName: 'Order',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your BigCommerce account',
        };
      }

      try {
        const response = await sendBigCommerceRequest<{
          data: Array<{ id: number; status: string }>;
        }>({
          auth: auth as BigCommerceAuth,
          method: HttpMethod.GET,
          url: '/orders',
          queryParams: {
            limit: '250',
          },
        });

        const orders = response.body.data || [];
        return {
          disabled: false,
          options: orders.map((order) => ({
            label: `Order #${order.id} (${order.status})`,
            value: order.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load orders',
        };
      }
    },
  }),
};

