import { Property } from '@activepieces/pieces-framework';

export const purchaseId = Property.ShortText({
  displayName: 'Purchase ID',
  description: 'The ID Kit returned when the purchase was created.',
  placeholder: '1234567',
  required: true,
});

export const purchaserEmailAddress = Property.ShortText({
  displayName: 'Email',
  description: "The buyer's email address.",
  placeholder: 'jane@example.com',
  required: true,
});

export const purchasesPageNumber = Property.Number({
  displayName: 'Page',
  description: 'Up to 50 purchases per page.',
  required: true,
  defaultValue: 1,
});

export const transactionId = Property.Number({
  displayName: 'Transaction ID',
  description: "Your store's ID for this order.",
  required: true,
});

export const productId = Property.Number({
  displayName: 'Product ID',
  description: "Your store's ID for the product.",
  required: true,
});

// Create purchase

export const status = Property.StaticDropdown({
  displayName: 'Status',
  description: 'Payment status of the order.',
  required: false,
  options: {
    options: [
      { label: 'Paid', value: 'paid' },
      { label: 'Pending', value: 'pending' },
      { label: 'Failed', value: 'failed' },
    ],
  },
});

export const currency = Property.StaticDropdown({
  displayName: 'Currency',
  description: 'Currency of every amount on this purchase.',
  required: true,
  options: {
    options: [
      { label: 'USD', value: 'USD' },
      { label: 'JPY', value: 'JPY' },
      { label: 'GBP', value: 'GBP' },
      { label: 'EUR', value: 'EUR' },
      { label: 'CAD', value: 'CAD' },
      { label: 'AUD', value: 'AUD' },
      { label: 'NZD', value: 'NZD' },
      { label: 'CHF', value: 'CHF' },
      { label: 'HKD', value: 'HKD' },
      { label: 'SGD', value: 'SGD' },
      { label: 'SEK', value: 'SEK' },
      { label: 'DKK', value: 'DKK' },
      { label: 'PLN', value: 'PLN' },
      { label: 'NOK', value: 'NOK' },
      { label: 'HUF', value: 'HUF' },
      { label: 'CZK', value: 'CZK' },
      { label: 'ILS', value: 'ILS' },
      { label: 'MXN', value: 'MXN' },
      { label: 'MYR', value: 'MYR' },
      { label: 'BRL', value: 'BRL' },
      { label: 'PHP', value: 'PHP' },
      { label: 'TWD', value: 'TWD' },
      { label: 'THB', value: 'THB' },
      { label: 'TRY', value: 'TRY' },
      { label: 'RUB', value: 'RUB' },
      { label: 'INR', value: 'INR' },
      { label: 'KRW', value: 'KRW' },
      { label: 'AED', value: 'AED' },
      { label: 'SAR', value: 'SAR' },
      { label: 'ZAR', value: 'ZAR' },
    ],
  },
});

export const transactionTime = Property.DateTime({
  displayName: 'Transaction Time',
  description: 'When the order was placed.',
  placeholder: '2026-01-31',
  required: false,
});

export const subtotal = Property.Number({
  displayName: 'Subtotal',
  required: false,
});

export const shipping = Property.Number({
  displayName: 'Shipping',
  required: false,
});

export const discount = Property.Number({
  displayName: 'Discount',
  required: false,
});

export const tax = Property.Number({
  displayName: 'Tax',
  required: false,
});

export const total = Property.Number({
  displayName: 'Total',
  description: 'The amount the buyer paid.',
  required: false,
});

export const products = {
  pid: Property.Number({
    displayName: 'Product ID',
    description: "Your store's ID for the product.",
    required: true,
  }),
  lid: Property.Number({
    displayName: 'Line Item ID',
    description: "Your store's ID for this order line.",
    required: true,
  }),
  name: Property.ShortText({
    displayName: 'Product Name',
    required: true,
  }),
  sku: Property.ShortText({
    displayName: 'SKU',
    required: false,
  }),
  unit_price: Property.Number({
    displayName: 'Unit Price',
    required: true,
  }),
  quantity: Property.Number({
    displayName: 'Quantity',
    required: true,
  }),
};

export const multipleProducts = Property.Json({
  displayName: 'Products',
  description:
    'A JSON list; each item needs pid, lid, name, unit_price and quantity.',
  required: true,
  defaultValue: [
    {
      pid: 9999,
      lid: 7777,
      name: 'Floppy Disk (512k)',
      sku: '7890-ijkl',
      unit_price: 5.0,
      quantity: 2,
    },
    {
      pid: 5555,
      lid: 7778,
      name: 'Telephone Cord (data)',
      sku: 'mnop-1234',
      unit_price: 10.0,
      quantity: 1,
    },
  ],
});
