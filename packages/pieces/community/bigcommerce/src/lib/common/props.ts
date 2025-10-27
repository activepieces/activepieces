import { Property } from '@activepieces/pieces-framework';
import { sendBigCommerceRequest } from './client';
import { BigCommerceAuth } from './auth';
import { HttpMethod } from '@activepieces/pieces-common';

export const customerIdDropdown = Property.Dropdown({
  displayName: 'Customer',
  description: 'Select a customer',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const response = await sendBigCommerceRequest({
        auth: auth as BigCommerceAuth,
        url: '/customers',
        method: HttpMethod.GET,
        queryParams: { limit: '50' },
      });

      const customers = (response.body as { data: any[] }).data || [];

      if (customers.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: 'No customers found',
        };
      }

      return {
        disabled: false,
        options: customers.map((customer: any) => ({
          label: `${customer.first_name} ${customer.last_name} (${customer.email})`,
          value: customer.id.toString(),
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error fetching customers',
      };
    }
  },
});

export const productIdDropdown = Property.Dropdown({
  displayName: 'Product',
  description: 'Select a product',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const response = await sendBigCommerceRequest({
        auth: auth as BigCommerceAuth,
        url: '/catalog/products',
        method: HttpMethod.GET,
        queryParams: { limit: '50' },
      });

      const products = (response.body as { data: any[] }).data || [];

      if (products.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: 'No products found',
        };
      }

      return {
        disabled: false,
        options: products.map((product: any) => ({
          label: `${product.name} (${product.sku || 'No SKU'})`,
          value: product.id.toString(),
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error fetching products',
      };
    }
  },
});

export const orderIdDropdown = Property.Dropdown({
  displayName: 'Order',
  description: 'Select an order',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const response = await sendBigCommerceRequest({
        auth: auth as BigCommerceAuth,
        url: '/orders',
        method: HttpMethod.GET,
        queryParams: { limit: '50', sort: 'date_created:desc' },
      });

      const orders = (response.body as { data: any[] }).data || [];

      if (orders.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: 'No orders found',
        };
      }

      return {
        disabled: false,
        options: orders.map((order: any) => ({
          label: `Order #${order.id} - ${order.status} (${order.total_inc_tax})`,
          value: order.id.toString(),
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error fetching orders',
      };
    }
  },
});

export const cartIdDropdown = Property.Dropdown({
  displayName: 'Cart',
  description: 'Select a cart',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const response = await sendBigCommerceRequest({
        auth: auth as BigCommerceAuth,
        url: '/carts',
        method: HttpMethod.GET,
        queryParams: { limit: '50' },
      });

      const carts = (response.body as { data: any[] }).data || [];

      if (carts.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: 'No carts found',
        };
      }

      return {
        disabled: false,
        options: carts.map((cart: any) => ({
          label: `Cart ${cart.id} - ${cart.email || 'No email'} (${cart.cart_amount || 0})`,
          value: cart.id.toString(),
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error fetching carts',
      };
    }
  },
});

export const customerAddressIdDropdown = (customerId?: string) => Property.Dropdown({
  displayName: 'Customer Address',
  description: 'Select a customer address',
  required: true,
  refreshers: ['auth', 'customerId'],
  options: async ({ auth, customerId: customerIdFromProps }) => {
    const actualCustomerId = customerId || customerIdFromProps;
    
    if (!auth || !actualCustomerId) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please select a customer first',
      };
    }

    try {
      const response = await sendBigCommerceRequest({
        auth: auth as BigCommerceAuth,
        url: `/customers/${actualCustomerId}/addresses`,
        method: HttpMethod.GET,
      });

      const addresses = (response.body as { data: any[] }).data || [];

      if (addresses.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: 'No addresses found for this customer',
        };
      }

      return {
        disabled: false,
        options: addresses.map((address: any) => ({
          label: `${address.address1}, ${address.city}, ${address.state_or_province} ${address.postal_code}`,
          value: address.id.toString(),
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error fetching customer addresses',
      };
    }
  },
});