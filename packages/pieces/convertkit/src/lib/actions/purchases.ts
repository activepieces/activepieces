import {
  createAction,
  Property,
  DynamicPropsValue,
} from '@activepieces/pieces-framework';
import { convertkitAuth } from '../..';
import { CONVERTKIT_API_URL, subscriberId } from '../common';

const API_ENDPOINT = 'purchases';

export const getPurchases = async (auth: string) => {
  const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}?api_secret=${auth}`;
  const response = await fetch(url);
  return await response.json();
};

export const listPurchases = createAction({
  auth: convertkitAuth,
  name: 'purchases_list_purchases',
  displayName: 'Purchases: List Purchases',
  description: 'Returns a list of all purchases',
  props: {
    page: Property.Number({
      displayName: 'Page',
      description:
        'Page number. Each page of results will contain up to 50 purchases.',
      required: false,
      defaultValue: 1,
    }),
  },
  async run(context) {
    const page = context.propsValue.page || 1;
    const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}?page=${page}&api_secret=${context.auth}`;

    // Fetch URL using fetch api
    const response = await fetch(url);

    // Get response body
    const data = await response.json();

    // Return response body
    return data;
  },
});

// Show a single purchase

const purchaseId = Property.Number({
  displayName: 'Purchase ID',
  description: 'The purchase ID',
  required: true,
});

export const getPurchaseById = createAction({
  auth: convertkitAuth,
  name: 'purchases_get_purchase_by_id',
  displayName: 'Purchases: Get Purchase By Id',
  description: 'Returns data for a single purchase',
  props: {
    purchaseId,
  },
  async run(context) {
    const { purchaseId } = context.propsValue;
    const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}/${purchaseId}?api_secret=${context.auth}`;

    // Fetch URL using fetch api
    const response = await fetch(url);

    // Get response body
    const data = await response.json();

    // Return response body
    return data;
  },
});

// Create purchase

const transactionId = Property.ShortText({
  displayName: 'Transaction ID',
  description: 'The transaction ID',
  required: true,
});

const status = Property.StaticDropdown({
  displayName: 'Status',
  description: 'The status of the purchase',
  required: true,
  options: {
    options: [
      { label: 'paid', value: 'paid' },
      { label: 'pending', value: 'pending' },
      { label: 'failed', value: 'failed' },
    ],
  },
});

const emailAddress = Property.ShortText({
  displayName: 'Email Address',
  description: 'The email address of the subscriber',
  required: true,
});

const currency = Property.StaticDropdown({
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

const transactionTime = Property.DateTime({
  displayName: 'Transaction Time',
  description: 'The transaction time',
  required: true,
});

const subtotal = Property.Number({
  displayName: 'Subtotal',
  description: 'The subtotal',
  required: true,
});

const shipping = Property.Number({
  displayName: 'Shipping',
  description: 'The shipping',
  required: true,
});

const discount = Property.Number({
  displayName: 'Discount',
  description: 'The discount',
  required: true,
});

const tax = Property.Number({
  displayName: 'Tax',
  description: 'The tax',
  required: true,
});

const total = Property.Number({
  displayName: 'Total',
  description: 'The total',
  required: true,
});

const first_name = Property.ShortText({
  displayName: 'First Name',
  description: 'The first name of the subscriber',
  required: false,
});

const products = Property.DynamicProperties({
  displayName: 'Products',
  description: 'The products',
  required: true,
  refreshers: ['auth'],
  props: async (auth) => {
    const fields: DynamicPropsValue = {
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
        required: true,
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
    return fields;
  },
});

export const createSinglePurchase = createAction({
  auth: convertkitAuth,
  name: 'purchases_create_purchase',
  displayName: 'Purchases: Create Purchase',
  description: 'Creates a new purchase',
  props: {
    transactionId,
    transactionTime,
    emailAddress,
    first_name,
    status,
    currency,
    subtotal,
    shipping,
    discount,
    tax,
    total,
    products,
  },
  async run(context) {
    const {
      transactionId,
      transactionTime,
      emailAddress,
      first_name,
      status,
      currency,
      subtotal,
      shipping,
      discount,
      tax,
      total,
      products,
    } = context.propsValue;
    const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}`;

    const body = JSON.stringify(
      {
        api_secret: context.auth,
        purchase: {
          transaction_id: transactionId,
          status,
          email_address: emailAddress,
          currency,
          transaction_time: transactionTime,
          subtotal,
          shipping,
          discount,
          tax,
          total,
          first_name,
          products: [products],
        },
      },
      null,
      2
    );

    // Fetch URL using fetch api
    const response = await fetch(url, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Get response body
    const data = await response.json();

    // Return response body
    return data;
  },
});

const multipleProducts = Property.Json({
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

export const createPurchases = createAction({
  auth: convertkitAuth,
  name: 'purchases_create_multible_purchases',
  displayName: 'Purchases: Create Multiple Purchases',
  description: 'Creates multiple purchases',
  props: {
    transactionId,
    transactionTime,
    emailAddress,
    first_name,
    status,
    currency,
    subtotal,
    shipping,
    discount,
    tax,
    total,
    multipleProducts,
  },
  async run(context) {
    const {
      transactionId,
      transactionTime,
      emailAddress,
      first_name,
      status,
      currency,
      subtotal,
      shipping,
      discount,
      tax,
      total,
      multipleProducts,
    } = context.propsValue;
    const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}`;

    const body = JSON.stringify(
      {
        api_secret: context.auth,
        purchase: {
          transaction_id: transactionId,
          status,
          email_address: emailAddress,
          first_name,
          currency,
          transaction_time: transactionTime,
          subtotal,
          shipping,
          discount,
          tax,
          total,
          products: multipleProducts,
        },
      },
      null,
      2
    );

    // Fetch URL using fetch api
    const response = await fetch(url, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Get response body
    const data = await response.json();

    // Return response body
    return data;
  },
});

// ---------> Below are "unofficial". Need to be tested. <---------
// Show all purchases for a subscriber

export const listPurchasesForSubscriber = createAction({
  auth: convertkitAuth,
  name: 'purchases_list_purchases_for_subscriber',
  displayName: 'Purchases: List Purchases For Subscriber',
  description: 'Returns a list of all purchases for a subscriber',
  props: {
    subscriberId,
  },
  async run(context) {
    const { subscriberId } = context.propsValue;
    const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}?api_secret=${context.auth}&subscriber_id=${subscriberId}`;

    // Fetch URL using fetch api
    const response = await fetch(url);

    // Get response body
    const data = await response.json();

    // Return response body
    return data;
  },
});

// Show all purchases for a product

const productId = Property.Number({
  displayName: 'Product ID',
  description: 'The product ID',
  required: true,
});

export const listPurchasesForProduct = createAction({
  auth: convertkitAuth,
  name: 'purchases_list_purchases_for_product',
  displayName: 'Purchases: List Purchases For Product',
  description: 'Returns a list of all purchases for a product',
  props: {
    productId,
  },
  async run(context) {
    const { productId } = context.propsValue;
    const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}?api_secret=${context.auth}&product_id=${productId}`;

    // Fetch URL using fetch api
    const response = await fetch(url);

    // Get response body
    const data = await response.json();

    // Return response body
    return data;
  },
});

// Show all purchases for a form

const formId = Property.Number({
  displayName: 'Form ID',
  description: 'The form ID',
  required: true,
});

export const listPurchasesForForm = createAction({
  auth: convertkitAuth,
  name: 'purchases_list_purchases_for_form',
  displayName: 'Purchases: List Purchases For Form',
  description: 'Returns a list of all purchases for a form',
  props: {
    formId,
  },
  async run(context) {
    const { formId } = context.propsValue;
    const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}?api_secret=${context.auth}&form_id=${formId}`;

    // Fetch URL using fetch api
    const response = await fetch(url);

    // Get response body
    const data = await response.json();

    // Return response body
    return data;
  },
});

// Show all purchases for a sequence

const sequenceId = Property.Number({
  displayName: 'Sequence ID',
  description: 'The sequence ID',
  required: true,
});

export const listPurchasesForSequence = createAction({
  auth: convertkitAuth,
  name: 'purchases_list_purchases_for_sequence',
  displayName: 'Purchases: List Purchases For Sequence',
  description: 'Returns a list of all purchases for a sequence',
  props: {
    sequenceId,
  },
  async run(context) {
    const { sequenceId } = context.propsValue;
    const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}?api_secret=${context.auth}&sequence_id=${sequenceId}`;

    // Fetch URL using fetch api
    const response = await fetch(url);

    // Get response body
    const data = await response.json();

    // Return response body
    return data;
  },
});
