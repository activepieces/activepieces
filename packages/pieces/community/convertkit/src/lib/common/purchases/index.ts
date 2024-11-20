import { Property } from '@activepieces/pieces-framework';

export const purchaseId = Property.ShortText({
  displayName: 'Purchase ID',
  description: 'The purchase ID',
  required: true,
});

export const purchaserEmailAddress = Property.ShortText({
  displayName: 'Email Address',
  description: 'The email address of the subscriber',
  required: true,
});

export const purchasesPageNumber = Property.Number({
  displayName: 'Page',
  description:
    'Page number. Each page of results will contain up to 50 purchases.',
  required: true,
  defaultValue: 1,
});

export const transactionId = Property.Number({
  displayName: 'Transaction ID',
  description: 'The transaction ID',
  required: true,
});

export const productId = Property.Number({
  displayName: 'Product ID',
  description: 'The product ID',
  required: true,
});

// Create purchase

export const status = Property.StaticDropdown({
  displayName: 'Status',
  description: 'The status of the purchase',
  required: false,
  options: {
    options: [
      { label: 'paid', value: 'paid' },
      { label: 'pending', value: 'pending' },
      { label: 'failed', value: 'failed' },
    ],
  },
});

export const currency = Property.StaticDropdown({
  displayName: 'Currency',
  description: 'The currency of the purchase',
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
  description: 'The transaction time',
  required: false,
});

export const subtotal = Property.Number({
  displayName: 'Subtotal',
  description: 'The subtotal',
  required: false,
});

export const shipping = Property.Number({
  displayName: 'Shipping',
  description: 'The shipping',
  required: false,
});

export const discount = Property.Number({
  displayName: 'Discount',
  description: 'The discount',
  required: false,
});

export const tax = Property.Number({
  displayName: 'Tax',
  description: 'The tax',
  required: false,
});

export const total = Property.Number({
  displayName: 'Total',
  description: 'The total',
  required: false,
});

export const products = {
  pid: Property.Number({
    displayName: 'Product ID',
    description: 'The product ID',
    required: true,
  }),
  lid: Property.Number({
    displayName: 'Line Item ID',
    description: 'The line item ID',
    required: true,
  }),
  name: Property.ShortText({
    displayName: 'Name',
    description: 'The name of the product',
    required: true,
  }),
  sku: Property.ShortText({
    displayName: 'SKU',
    description: 'The SKU of the product',
    required: false,
  }),
  unit_price: Property.Number({
    displayName: 'Unit Price',
    description: 'The unit price of the product',
    required: true,
  }),
  quantity: Property.Number({
    displayName: 'Quantity',
    description: 'The quantity of the product',
    required: true,
  }),
};

export const multipleProducts = Property.Json({
  displayName: 'Products',
  description: 'The products',
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
