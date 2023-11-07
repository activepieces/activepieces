import { createAction } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { convertkitAuth } from '../..';
import {
  API_ENDPOINT,
  fetchPurchases,
  purchaseId,
  page,
  transactionId,
  productId,
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
  products,
  multipleProducts,
} from '../common/purchases';
import { Purchase } from '../common/models';
import { subscriberId } from '../common/subscribers';
import { formId } from '../common/forms';
import { sequenceId } from '../common/sequences';
import { CONVERTKIT_API_URL } from '../common/constants';

export const listPurchases = createAction({
  auth: convertkitAuth,
  name: 'purchases_list_purchases',
  displayName: 'Purchases: List Purchases',
  description: 'Returns a list of all purchases',
  props: {
    page,
  },
  async run(context) {
    const page = context.propsValue.page || 1;
    return await fetchPurchases(context.auth, page);
  },
});

// Show a single purchase

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
    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}/${purchaseId}?api_secret=${context.auth}`;

    const request: HttpRequest = {
      url,
      method: HttpMethod.GET,
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
  displayName: 'Purchases: Create Purchase',
  description: 'Creates a new purchase',
  props: {
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
    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}`;

    const body = {
      api_secret: context.auth,
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
  name: 'purchases_create_multible_purchases',
  displayName: 'Purchases: Create Multiple Purchases',
  description: 'Creates multiple purchases',
  props: {
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
    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}`;

    const body = {
      api_secret: context.auth,
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
  displayName: 'Purchases: List Purchases For Subscriber',
  description: 'Returns a list of all purchases for a subscriber',
  props: {
    subscriberId,
  },
  async run(context) {
    const { subscriberId } = context.propsValue;
    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}?api_secret=${context.auth}&subscriber_id=${subscriberId}`;

    const response = await fetch(url);

    if (!response.ok) {
      return { success: false, message: 'Error fetching purchases' };
    }

    const data = await response.json();

    return data;
  },
});

// Show all purchases for a product

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
    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}?api_secret=${context.auth}&product_id=${productId}`;

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
  displayName: 'Purchases: List Purchases For Form',
  description: 'Returns a list of all purchases for a form',
  props: {
    formId,
  },
  async run(context) {
    const { formId } = context.propsValue;
    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}?api_secret=${context.auth}&form_id=${formId}`;

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
  displayName: 'Purchases: List Purchases For Sequence',
  description: 'Returns a list of all purchases for a sequence',
  props: {
    sequenceId,
  },
  async run(context) {
    const { sequenceId } = context.propsValue;
    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}?api_secret=${context.auth}&sequence_id=${sequenceId}`;

    const response = await fetch(url);

    if (!response.ok) {
      return { success: false, message: 'Error fetching purchases' };
    }

    const data = await response.json();

    return data;
  },
});
