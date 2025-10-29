import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendBigCommerceRequest, BigCommerceAuth } from './auth';

export const bigCommerceCommon = {
  // Dynamic Dropdowns
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

  brand_id: Property.Dropdown({
    displayName: 'Brand',
    required: false,
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
          url: '/catalog/brands',
          queryParams: {
            limit: '250',
          },
        });

        const brands = response.body.data || [];
        return {
          disabled: false,
          options: brands.map((brand) => ({
            label: brand.name,
            value: brand.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load brands',
        };
      }
    },
  }),

  category_id: Property.Dropdown({
    displayName: 'Category',
    required: false,
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
          data: Array<{ id: number; name: string; parent_id: number }>;
        }>({
          auth: auth as BigCommerceAuth,
          method: HttpMethod.GET,
          url: '/catalog/categories',
          queryParams: {
            limit: '250',
          },
        });

        const categories = response.body.data || [];
        return {
          disabled: false,
          options: categories.map((category) => ({
            label: category.name,
            value: category.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load categories',
        };
      }
    },
  }),

  // Static Dropdowns for Product Properties
  product_type: Property.StaticDropdown({
    displayName: 'Product Type',
    description: 'The type of product',
    required: true,
    options: {
      options: [
        { label: 'Physical', value: 'physical' },
        { label: 'Digital', value: 'digital' },
      ],
    },
  }),

  product_type_optional: Property.StaticDropdown({
    displayName: 'Product Type',
    description: 'Filter by product type',
    required: false,
    options: {
      options: [
        { label: 'Physical', value: 'physical' },
        { label: 'Digital', value: 'digital' },
      ],
    },
  }),

  availability: Property.StaticDropdown({
    displayName: 'Availability',
    description: 'The availability status of the product',
    required: false,
    options: {
      options: [
        { label: 'Available', value: 'available' },
        { label: 'Disabled', value: 'disabled' },
        { label: 'Pre-order', value: 'preorder' },
      ],
    },
    defaultValue: 'available',
  }),

  availability_filter: Property.StaticDropdown({
    displayName: 'Availability',
    description: 'Filter by availability status',
    required: false,
    options: {
      options: [
        { label: 'Available', value: 'available' },
        { label: 'Disabled', value: 'disabled' },
        { label: 'Pre-order', value: 'preorder' },
      ],
    },
  }),

  inventory_tracking: Property.StaticDropdown({
    displayName: 'Inventory Tracking',
    description: 'How to track inventory for this product',
    required: false,
    options: {
      options: [
        { label: 'None', value: 'none' },
        { label: 'Product', value: 'product' },
        { label: 'Variant', value: 'variant' },
      ],
    },
    defaultValue: 'none',
  }),

  product_condition: Property.StaticDropdown({
    displayName: 'Condition',
    description: 'The condition of the product',
    required: false,
    options: {
      options: [
        { label: 'New', value: 'New' },
        { label: 'Used', value: 'Used' },
        { label: 'Refurbished', value: 'Refurbished' },
      ],
    },
    defaultValue: 'New',
  }),

  // Address Properties
  address_type: Property.StaticDropdown({
    displayName: 'Address Type',
    description: 'The type of address (residential or commercial)',
    required: false,
    options: {
      options: [
        { label: 'Residential', value: 'residential' },
        { label: 'Commercial', value: 'commercial' },
      ],
    },
  }),

  country_code: Property.ShortText({
    displayName: 'Country Code',
    description: 'The two-letter ISO country code (e.g., US, CA, GB)',
    required: true,
  }),

  state_or_province: Property.ShortText({
    displayName: 'State or Province',
    description: 'The state or province (e.g., TX, California, Ontario)',
    required: true,
  }),

  // Order Status Filter (for triggers)
  order_status_filter: Property.StaticMultiSelectDropdown({
    displayName: 'Order Status Filter',
    description: 'Only trigger for orders with these statuses (leave empty for all)',
    required: false,
    options: {
      options: [
        { label: 'Incomplete', value: 'Incomplete' },
        { label: 'Pending', value: 'Pending' },
        { label: 'Shipped', value: 'Shipped' },
        { label: 'Partially Shipped', value: 'Partially Shipped' },
        { label: 'Refunded', value: 'Refunded' },
        { label: 'Cancelled', value: 'Cancelled' },
        { label: 'Declined', value: 'Declined' },
        { label: 'Awaiting Payment', value: 'Awaiting Payment' },
        { label: 'Awaiting Pickup', value: 'Awaiting Pickup' },
        { label: 'Awaiting Shipment', value: 'Awaiting Shipment' },
        { label: 'Completed', value: 'Completed' },
        { label: 'Awaiting Fulfillment', value: 'Awaiting Fulfillment' },
        { label: 'Manual Verification Required', value: 'Manual Verification Required' },
        { label: 'Disputed', value: 'Disputed' },
        { label: 'Partially Refunded', value: 'Partially Refunded' },
      ],
    },
  }),

  // Customer Group Filter (for triggers)
  customer_group_filter: Property.Dropdown({
    displayName: 'Customer Group Filter',
    description: 'Only trigger for customers in this group (leave empty for all)',
    required: false,
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
          url: '/customer_groups',
          queryParams: {
            limit: '250',
          },
          version: 'v2',
        });

        const groups = response.body.data || [];
        return {
          disabled: false,
          options: groups.map((group) => ({
            label: group.name,
            value: group.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load customer groups',
        };
      }
    },
  }),
};

