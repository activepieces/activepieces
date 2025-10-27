import { createAction, Property } from "@activepieces/pieces-framework";
import { shippoAuth } from "../../lib/auth";
import { ShippoClient } from "../../lib/client";

export const createOrder = createAction({
  name: 'create_order',
  displayName: 'Create Order',
  description: 'Create a new order in Shippo',
  auth: shippoAuth,
  props: {
    order_number: Property.ShortText({
      displayName: 'Order Number',
      description: 'Unique identifier for the order',
      required: true,
    }),
    order_status: Property.StaticDropdown({
      displayName: 'Order Status',
      description: 'Current status of the order',
      required: true,
      options: {
        options: [
          { label: 'Paid', value: 'PAID' },
          { label: 'Unpaid', value: 'UNPAID' },
          { label: 'Cancelled', value: 'CANCELLED' },
          { label: 'Refunded', value: 'REFUNDED' },
          { label: 'On Hold', value: 'ONHOLD' },
        ],
      },
      defaultValue: 'UNPAID'
    }),
    placed_at: Property.DateTime({
      displayName: 'Order Date',
      description: 'When the order was placed',
      required: false,
    }),
    total_price: Property.ShortText({
      displayName: 'Total Price',
      description: 'Total price including shipping and tax',
      required: true,
    }),
    total_tax: Property.ShortText({
      displayName: 'Total Tax',
      description: 'Total tax amount',
      required: false,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'Currency code (e.g., USD, EUR)',
      required: true,
      defaultValue: 'USD',
    }),

    // Sender Address (From Address)
    from_name: Property.ShortText({
      displayName: 'Sender Name',
      description: 'Name of the sender',
      required: true,
    }),
    from_street1: Property.ShortText({
      displayName: 'Sender Street Address',
      description: 'Street address line 1',
      required: true,
    }),
    from_city: Property.ShortText({
      displayName: 'Sender City',
      description: 'City',
      required: true,
    }),
    from_state: Property.ShortText({
      displayName: 'Sender State',
      description: 'State/Province',
      required: true,
    }),
    from_zip: Property.ShortText({
      displayName: 'Sender ZIP Code',
      description: 'ZIP/Postal code',
      required: true,
    }),
    from_country: Property.ShortText({
      displayName: 'Sender Country',
      description: 'Two-letter country code (e.g., US)',
      required: true,
      defaultValue: 'US',
    }),
    from_phone: Property.ShortText({
      displayName: 'Sender Phone',
      required: false,
    }),
    from_email: Property.ShortText({
      displayName: 'Sender Email',
      required: false,
    }),

    // Recipient Address (To Address)
    to_name: Property.ShortText({
      displayName: 'Recipient Name',
      description: 'Name of the recipient',
      required: true,
    }),
    to_street1: Property.ShortText({
      displayName: 'Recipient Street Address',
      description: 'Street address line 1',
      required: true,
    }),
    to_city: Property.ShortText({
      displayName: 'Recipient City',
      description: 'City',
      required: true,
    }),
    to_state: Property.ShortText({
      displayName: 'Recipient State',
      description: 'State/Province',
      required: true,
    }),
    to_zip: Property.ShortText({
      displayName: 'Recipient ZIP Code',
      description: 'ZIP/Postal code',
      required: true,
    }),
    to_country: Property.ShortText({
      displayName: 'Recipient Country',
      description: 'Two-letter country code (e.g., US)',
      required: true,
      defaultValue: 'US',
    }),
    to_phone: Property.ShortText({
      displayName: 'Recipient Phone',
      required: false,
    }),
    to_email: Property.ShortText({
      displayName: 'Recipient Email',
      required: false,
    }),

    // Line Items - Single Item (Simple approach)
    line_item_title: Property.ShortText({
      displayName: 'Item Title',
      description: 'Name/description of the item',
      required: true,
    }),
    line_item_quantity: Property.Number({
      displayName: 'Item Quantity',
      required: true,
      defaultValue: 1,
    }),
    line_item_price: Property.ShortText({
      displayName: 'Item Price',
      description: 'Price per item (e.g., "29.99")',
      required: true,
    }),
    line_item_sku: Property.ShortText({
      displayName: 'Item SKU',
      description: 'Stock keeping unit',
      required: false,
    }),
    line_item_weight: Property.ShortText({
      displayName: 'Item Weight',
      description: 'Weight of a single item (e.g., "0.5")',
      required: false,
    }),
    line_item_weight_unit: Property.StaticDropdown({
      displayName: 'Item Weight Unit',
      required: false,
      defaultValue: 'lb',
      options: {
        options: [
          { label: 'Pounds (lb)', value: 'lb' },
          { label: 'Ounces (oz)', value: 'oz' },
          { label: 'Kilograms (kg)', value: 'kg' },
          { label: 'Grams (g)', value: 'g' },
        ],
      },
    }),

    // Shipping Information
    weight: Property.ShortText({
      displayName: 'Total Package Weight',
      description: 'Total weight of the package for shipping (e.g., "2.5")',
      required: true,
    }),
    weight_unit: Property.StaticDropdown({
      displayName: 'Package Weight Unit',
      description: 'Unit for total package weight',
      required: false,
      defaultValue: 'lb',
      options: {
        options: [
          { label: 'Pounds (lb)', value: 'lb' },
          { label: 'Ounces (oz)', value: 'oz' },
          { label: 'Kilograms (kg)', value: 'kg' },
          { label: 'Grams (g)', value: 'g' },
        ],
      },
    }),
    shipping_cost: Property.ShortText({
      displayName: 'Shipping Cost',
      description: 'Shipping cost amount (e.g., "5.99")',
      required: false,
    }),
    shipping_cost_currency: Property.ShortText({
      displayName: 'Shipping Cost Currency',
      description: 'Currency for shipping cost',
      required: false,
      defaultValue: 'USD',
    }),

    // Multiple Line Items
    additional_line_items: Property.Json({
      displayName: 'Additional Line Items',
      description: 'Additional line items in JSON format. Example: [{"title": "Product 2", "quantity": 2, "total_price": "20.00"}]',
      required: false,
      defaultValue: [],
    }),
  },
  async run(context) {
    const {
      order_number,
      order_status,
      placed_at,
      total_price,
      total_tax,
      currency,
      from_name,
      from_street1,
      from_city,
      from_state,
      from_zip,
      from_country,
      from_phone,
      from_email,
      to_name,
      to_street1,
      to_city,
      to_state,
      to_zip,
      to_country,
      to_phone,
      to_email,
      line_item_title,
      line_item_quantity,
      line_item_price,
      line_item_sku,
      line_item_weight,
      line_item_weight_unit,
      weight,
      weight_unit,
      shipping_cost,
      shipping_cost_currency,
      additional_line_items,
    } = context.propsValue;

    const client = new ShippoClient({
      apiToken: context.auth,
    });

    // Build from address
    const from_address: any = {
      name: from_name,
      street1: from_street1,
      city: from_city,
      state: from_state,
      zip: from_zip,
      country: from_country,
    };
    if (from_phone) from_address.phone = from_phone;
    if (from_email) from_address.email = from_email;

    // Build to address
    const to_address: any = {
      name: to_name,
      street1: to_street1,
      city: to_city,
      state: to_state,
      zip: to_zip,
      country: to_country,
    };
    if (to_phone) to_address.phone = to_phone;
    if (to_email) to_address.email = to_email;

    // Build line items
    const line_items = [];

    // Add primary line item
    const primary_item: any = {
      title: line_item_title,
      quantity: line_item_quantity,
      total_price: line_item_price,
      currency: currency,
    };
    if (line_item_sku) primary_item.sku = line_item_sku;
    if (line_item_weight) primary_item.weight = line_item_weight;
    if (line_item_weight_unit) primary_item.weight_unit = line_item_weight_unit;

    line_items.push(primary_item);

    // Add additional line items if provided
    if (additional_line_items && Array.isArray(additional_line_items)) {
      additional_line_items.forEach((item: any) => {
        const additional_item: any = {
          title: item.title || '',
          quantity: Number(item.quantity) || 1,
          total_price: item.total_price || item.price || '0.00',
          currency: item.currency || currency,
        };
        if (item.sku) additional_item.sku = item.sku;
        if (item.weight) additional_item.weight = item.weight;
        if (item.weight_unit) additional_item.weight_unit = item.weight_unit;
        
        line_items.push(additional_item);
      });
    }

    // Build order data
    const orderData: any = {
      order_number,
      order_status: order_status as 'PAID' | 'UNPAID' | 'CANCELLED' | 'REFUNDED' | 'ONHOLD',
      placed_at: placed_at || new Date().toISOString(),
      total_price,
      currency,
      from_address,
      to_address,
      line_items,
    };

    // Optional fields
    if (total_tax) orderData.total_tax = total_tax;
    if (weight) orderData.weight = weight;
    if (weight_unit) orderData.weight_unit = weight_unit;
    if (shipping_cost) orderData.shipping_cost = shipping_cost;
    if (shipping_cost_currency) orderData.shipping_cost_currency = shipping_cost_currency;

    return await client.createOrder(orderData);
  },
});