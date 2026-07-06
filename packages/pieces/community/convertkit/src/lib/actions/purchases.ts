import { createAction } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { convertkitAuth } from '../..';
import {
  purchaseId,
  purchasesPageNumber,
  transactionId,
  productId,
  transactionTime,
  purchaserEmailAddress,
  status,
  currency,
  subtotal,
  shipping,
  discount,
  tax,
  total,
  products,
  multipleProducts,
} from '../common/purchases';
import { subscriberFirstName } from '../common/subscribers';
import { Purchase } from '../common/types';
import { subscriberId } from '../common/subscribers';
import { formId } from '../common/forms';
import { sequenceId } from '../common/sequences';
import { PURCHASES_API_ENDPOINT } from '../common/constants';
import { fetchPurchases } from '../common/service';

export const listPurchases = createAction({
  auth: convertkitAuth,
  name: 'purchases_list_purchases',
  displayName: 'List Purchases',
  description: 'Returns a list of all purchases',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves a paginated list of all purchase records in the account; pass a page number to go beyond the first page. For purchases scoped to one subscriber, product, form, or sequence, prefer the dedicated filtered list actions. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    page: purchasesPageNumber,
  },
  run(context) {
    const page = context.propsValue.page || 1;
    return fetchPurchases(context.auth.secret_text, page);
  },
});

export const getPurchaseById = createAction({
  auth: convertkitAuth,
  name: 'purchases_get_purchase_by_id',
  displayName: 'Get Purchase By Id',
  description: 'Returns data for a single purchase',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches one purchase record by its ConvertKit purchase ID (not the external transaction ID). Use List Purchases first if only the transaction details are known. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    purchaseId,
  },
  async run(context) {
    const { purchaseId } = context.propsValue;
    const url = `${PURCHASES_API_ENDPOINT}/${purchaseId}`;

    const body = {
      api_secret: context.auth.secret_text,
    };

    const request: HttpRequest = {
      url,
      method: HttpMethod.GET,
      body,
    };

    const response = await httpClient.sendRequest<{
      purchase: Purchase;
    }>(request);

    if (response.status !== 200) {
      throw new Error(`Error fetching purchase: ${response.status}`);
    }

    return response.body;
  },
});

//TODO:
// Required for third party integrations
// Are you building an integration? Please fill out this form and we will help you get set up.

// purchase.integration - The name of your integration (i.e. eBay)
// integration_key - A token for tracking integrations (i.e. eBay order number)

export const createSinglePurchase = createAction({
  auth: convertkitAuth,
  name: 'purchases_create_purchase',
  displayName: 'Create Purchase',
  description: 'Creates a new purchase',
  audience: 'both',
  aiMetadata: {
    description:
      'Records a purchase with a single product line item against a subscriber email, including transaction ID, status, currency, and amounts. Use Create Multiple Purchases instead when an order contains several products. Not idempotent — repeat calls create duplicate purchase records.',
    idempotent: false,
  },
  props: {
    transactionId,
    transactionTime,
    emailAddress: purchaserEmailAddress,
    firstName: subscriberFirstName,
    status,
    currency,
    subtotal,
    shipping,
    discount,
    tax,
    total,
    ...products,
  },
  async run(context) {
    const {
      transactionId,
      transactionTime,
      emailAddress,
      firstName,
      status,
      currency,
      subtotal,
      shipping,
      discount,
      tax,
      total,
      ...products
    } = context.propsValue;
    const url = PURCHASES_API_ENDPOINT;

    const body = {
      api_secret: context.auth.secret_text,
      purchase: {
        transaction_id: transactionId,
        status,
        first_name: firstName,
        email_address: emailAddress,
        currency,
        transaction_time: transactionTime,
        subtotal,
        shipping,
        discount,
        tax,
        total,
        products: [products],
      },
    };

    const request: HttpRequest = {
      url,
      method: HttpMethod.POST,
      body,
    };

    const response = await httpClient.sendRequest<{
      purchase: Purchase;
    }>(request);

    if (response.status !== 201) {
      throw new Error(`Error creating purchase: ${response.status}`);
    }

    return response.body;
  },
});

export const createPurchases = createAction({
  auth: convertkitAuth,
  name: 'purchases_create_multiple_purchases',
  displayName: 'Create Multiple Purchases',
  description: 'Creates multiple purchases',
  audience: 'both',
  aiMetadata: {
    description:
      'Records one purchase transaction containing multiple product line items for a subscriber email. Pick this over Create Purchase for multi-product orders. Not idempotent — repeat calls create duplicate purchase records.',
    idempotent: false,
  },
  props: {
    transactionId,
    transactionTime,
    emailAddress: purchaserEmailAddress,
    firstName: subscriberFirstName,
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
      firstName,
      status,
      currency,
      subtotal,
      shipping,
      discount,
      tax,
      total,
      multipleProducts,
    } = context.propsValue;
    const url = PURCHASES_API_ENDPOINT;

    const body = {
      api_secret: context.auth.secret_text,
      purchase: {
        transaction_id: transactionId,
        status,
        email_address: emailAddress,
        first_name: firstName,
        currency,
        transaction_time: transactionTime,
        subtotal,
        shipping,
        discount,
        tax,
        total,
        products: multipleProducts,
      },
    };

    const request: HttpRequest = {
      url,
      method: HttpMethod.POST,
      body,
    };

    const response = await httpClient.sendRequest<{
      purchase: Purchase;
    }>(request);

    if (response.status !== 201) {
      throw new Error(`Error creating purchase: ${response.status}`);
    }

    return response.body;
  },
});

// ---------> Below are "unofficial". Need to be tested. <---------
// Show all purchases for a subscriber

export const listPurchasesForSubscriber = createAction({
  auth: convertkitAuth,
  name: 'purchases_list_purchases_for_subscriber',
  displayName: 'List Purchases For Subscriber',
  description: 'Returns a list of all purchases for a subscriber',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists all purchases attributed to one subscriber by numeric subscriber ID. Use Get Subscriber By Email first if only an email address is known. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    subscriberId,
  },
  async run(context) {
    const { subscriberId } = context.propsValue;
    const url = PURCHASES_API_ENDPOINT;

    const body = {
      api_secret: context.auth.secret_text,
      subscriber_id: subscriberId,
    };

    const request: HttpRequest = {
      url,
      method: HttpMethod.GET,
      body,
    };

    const response = await httpClient.sendRequest<{
      purchases: Purchase[];
    }>(request);

    if (response.status !== 200) {
      throw new Error(`Error fetching purchases: ${response.status}`);
    }

    return response.body.purchases;
  },
});

// Show all purchases for a product

export const listPurchasesForProduct = createAction({
  auth: convertkitAuth,
  name: 'purchases_list_purchases_for_product',
  displayName: 'List Purchases For Product',
  description: 'Returns a list of all purchases for a product',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists all purchases of a specific product by product ID. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    productId,
  },
  async run(context) {
    const { productId } = context.propsValue;
    const url = `${PURCHASES_API_ENDPOINT}?api_secret=${context.auth.secret_text}&product_id=${productId}`;

    const response = await fetch(url);

    if (!response.ok) {
      return { success: false, message: 'Error fetching purchases' };
    }

    const data = await response.json();

    return data;
  },
});

// Show all purchases for a form

export const listPurchasesForForm = createAction({
  auth: convertkitAuth,
  name: 'purchases_list_purchases_for_form',
  displayName: 'List Purchases For Form',
  description: 'Returns a list of all purchases for a form',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists all purchases associated with a specific form by form ID. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    formId,
  },
  async run(context) {
    const { formId } = context.propsValue;
    const url = `${PURCHASES_API_ENDPOINT}?api_secret=${context.auth.secret_text}&form_id=${formId}`;

    const response = await fetch(url);

    if (!response.ok) {
      return { success: false, message: 'Error fetching purchases' };
    }

    const data = await response.json();

    return data;
  },
});

// Show all purchases for a sequence

export const listPurchasesForSequence = createAction({
  auth: convertkitAuth,
  name: 'purchases_list_purchases_for_sequence',
  displayName: 'List Purchases For Sequence',
  description: 'Returns a list of all purchases for a sequence',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists all purchases associated with a specific sequence by sequence ID. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    sequenceId,
  },
  async run(context) {
    const { sequenceId } = context.propsValue;
    const url = `${PURCHASES_API_ENDPOINT}?api_secret=${context.auth.secret_text}&sequence_id=${sequenceId}`;

    const response = await fetch(url);

    if (!response.ok) {
      return { success: false, message: 'Error fetching purchases' };
    }

    const data = await response.json();

    return data;
  },
});
