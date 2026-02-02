import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { katanaAuth } from '../common/auth';
import { BASE_URL } from '../common/constants';
import {
  customerDropdown,
  variantDropdown,
  taxRateDropdown,
  locationDropdown,
} from '../common/props';

interface OrderRowInput {
  variant_id: number;
  quantity: number;
  price_per_unit?: number;
  total_discount?: number;
  tax_rate_id?: number;
  location_id?: number;
}

interface AddressInput {
  entity_type: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  phone?: string;
  line_1?: string;
  line_2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export const createSalesOrder = createAction({
  auth: katanaAuth,
  name: 'create_sales_order',
  displayName: 'Create Sales Order',
  description: 'Creates a new sales order in Katana.',
  props: {
    order_no: Property.ShortText({
      displayName: 'Order Number',
      description: 'Unique order number.',
      required: true,
    }),
    customer_id: customerDropdown,
    // Simple mode: single product variant
    variant_id: variantDropdown,
    quantity: Property.Number({
      displayName: 'Quantity',
      description: 'Quantity for the product variant.',
      required: true,
    }),
    price_per_unit: Property.Number({
      displayName: 'Price Per Unit',
      description: 'Override price per unit.',
      required: false,
    }),
    total_discount: Property.Number({
      displayName: 'Total Discount',
      description: 'Discount amount for this line.',
      required: false,
    }),
    tax_rate_id: taxRateDropdown,
    additional_order_rows: Property.Json({
      displayName: 'Additional Order Lines (JSON)',
      description:
        'Add more line items as JSON array. Each object needs: variant_id, quantity. Optional: price_per_unit, total_discount, tax_rate_id, location_id.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Order status. Use PENDING for quotes.',
      required: false,
      options: {
        options: [
          { label: 'Not Shipped', value: 'NOT_SHIPPED' },
          { label: 'Pending (Quote)', value: 'PENDING' },
        ],
      },
    }),
    location_id: locationDropdown,
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'Currency code (ISO 4217), e.g. USD, EUR.',
      required: false,
    }),
    order_created_date: Property.DateTime({
      displayName: 'Order Created Date',
      required: false,
    }),
    delivery_date: Property.DateTime({
      displayName: 'Delivery Date',
      required: false,
    }),
    customer_ref: Property.ShortText({
      displayName: 'Customer Reference',
      description: 'Customer reference number (max 255 characters).',
      required: false,
    }),
    additional_info: Property.LongText({
      displayName: 'Additional Info',
      description: 'Additional notes for this order.',
      required: false,
    }),
    tracking_number: Property.ShortText({
      displayName: 'Tracking Number',
      description: 'Shipping tracking number (max 256 characters).',
      required: false,
    }),
    tracking_number_url: Property.ShortText({
      displayName: 'Tracking URL',
      description: 'URL to track the shipment.',
      required: false,
    }),
    addresses: Property.Array({
      displayName: 'Addresses',
      required: false,
      properties: {
        entity_type: Property.StaticDropdown({
          displayName: 'Address Type',
          required: true,
          options: {
            options: [
              { label: 'Billing', value: 'billing' },
              { label: 'Shipping', value: 'shipping' },
            ],
          },
        }),
        first_name: Property.ShortText({
          displayName: 'First Name',
          required: false,
        }),
        last_name: Property.ShortText({
          displayName: 'Last Name',
          required: false,
        }),
        company: Property.ShortText({
          displayName: 'Company',
          required: false,
        }),
        phone: Property.ShortText({
          displayName: 'Phone',
          required: false,
        }),
        line_1: Property.ShortText({
          displayName: 'Address Line 1',
          required: false,
        }),
        line_2: Property.ShortText({
          displayName: 'Address Line 2',
          required: false,
        }),
        city: Property.ShortText({
          displayName: 'City',
          required: false,
        }),
        state: Property.ShortText({
          displayName: 'State',
          required: false,
        }),
        zip: Property.ShortText({
          displayName: 'Zip/Postal Code',
          required: false,
        }),
        country: Property.ShortText({
          displayName: 'Country',
          required: false,
        }),
      },
    }),
    ecommerce_order_type: Property.ShortText({
      displayName: 'E-commerce Order Type',
      description: 'Source platform (e.g. shopify).',
      required: false,
    }),
    ecommerce_store_name: Property.ShortText({
      displayName: 'E-commerce Store Name',
      description: 'Store identifier.',
      required: false,
    }),
    ecommerce_order_id: Property.ShortText({
      displayName: 'E-commerce Order ID',
      description: 'External order ID from the e-commerce platform.',
      required: false,
    }),
  },
  async run(context) {
    const {
      order_no,
      customer_id,
      variant_id,
      quantity,
      price_per_unit,
      total_discount,
      tax_rate_id,
      additional_order_rows,
      status,
      location_id,
      currency,
      order_created_date,
      delivery_date,
      customer_ref,
      additional_info,
      tracking_number,
      tracking_number_url,
      addresses,
      ecommerce_order_type,
      ecommerce_store_name,
      ecommerce_order_id,
    } = context.propsValue;

    // Build the first order row
    const firstRow: Record<string, unknown> = {
      variant_id,
      quantity,
    };

    if (price_per_unit !== undefined && price_per_unit !== null) {
      firstRow['price_per_unit'] = price_per_unit;
    }
    if (total_discount !== undefined && total_discount !== null) {
      firstRow['total_discount'] = total_discount;
    }
    if (tax_rate_id) firstRow['tax_rate_id'] = tax_rate_id;
    if (location_id) firstRow['location_id'] = location_id;

    // Start with the first row
    const salesOrderRows: Record<string, unknown>[] = [firstRow];

    // Add additional rows if provided
    if (additional_order_rows) {
      const additionalRows = Array.isArray(additional_order_rows)
        ? additional_order_rows
        : [];
      for (const row of additionalRows as OrderRowInput[]) {
        const orderRow: Record<string, unknown> = {
          variant_id: row.variant_id,
          quantity: row.quantity,
        };
        if (row.price_per_unit !== undefined) {
          orderRow['price_per_unit'] = row.price_per_unit;
        }
        if (row.total_discount !== undefined) {
          orderRow['total_discount'] = row.total_discount;
        }
        if (row.tax_rate_id) orderRow['tax_rate_id'] = row.tax_rate_id;
        if (row.location_id) orderRow['location_id'] = row.location_id;
        salesOrderRows.push(orderRow);
      }
    }

    const body: Record<string, unknown> = {
      order_no,
      customer_id,
      sales_order_rows: salesOrderRows,
    };

    if (status) body['status'] = status;
    if (location_id) body['location_id'] = location_id;
    if (currency) body['currency'] = currency;
    if (order_created_date) body['order_created_date'] = order_created_date;
    if (delivery_date) body['delivery_date'] = delivery_date;
    if (customer_ref) body['customer_ref'] = customer_ref;
    if (additional_info) body['additional_info'] = additional_info;
    if (tracking_number) body['tracking_number'] = tracking_number;
    if (tracking_number_url) body['tracking_number_url'] = tracking_number_url;
    if (ecommerce_order_type) body['ecommerce_order_type'] = ecommerce_order_type;
    if (ecommerce_store_name) body['ecommerce_store_name'] = ecommerce_store_name;
    if (ecommerce_order_id) body['ecommerce_order_id'] = ecommerce_order_id;

    if (addresses && addresses.length > 0) {
      body['addresses'] = (addresses as AddressInput[]).map((addr) => {
        const address: Record<string, unknown> = {
          entity_type: addr.entity_type,
        };

        if (addr.first_name) address['first_name'] = addr.first_name;
        if (addr.last_name) address['last_name'] = addr.last_name;
        if (addr.company) address['company'] = addr.company;
        if (addr.phone) address['phone'] = addr.phone;
        if (addr.line_1) address['line_1'] = addr.line_1;
        if (addr.line_2) address['line_2'] = addr.line_2;
        if (addr.city) address['city'] = addr.city;
        if (addr.state) address['state'] = addr.state;
        if (addr.zip) address['zip'] = addr.zip;
        if (addr.country) address['country'] = addr.country;

        return address;
      });
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BASE_URL}/sales_orders`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      body,
    });

    return response.body;
  },
});
