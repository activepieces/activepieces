import { createAction } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../..';
import {
  API_ENDPOINT,
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
    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}?page=${page}&api_secret=${context.auth}`;

    // Fetch URL using fetch api
    const response = await fetch(url);

    if (!response.ok) {
      return { success: false, message: 'Error fetching purchases' };
    }

    // Get response body
    const data = await response.json();

    // If purchases exists, return purchases
    if (data.purchases) {
      return data.purchases;
    }

    // Return response body
    return data;
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

    // Fetch URL using fetch api
    const response = await fetch(url);

    if (!response.ok) {
      return { success: false, message: 'Error fetching purchase' };
    }

    // Get response body
    const data = await response.json();

    // Return response body
    return data;
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

    const body = JSON.stringify(
      {
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

    if (!response.ok) {
      return { success: false, message: 'Error creating purchase' };
    }

    // Get response body
    const data = await response.json();

    // Return response body
    return data;
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

    const body = JSON.stringify(
      {
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

    if (!response.ok) {
      return { success: false, message: 'Error creating purchase' };
    }

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
    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}?api_secret=${context.auth}&subscriber_id=${subscriberId}`;

    // Fetch URL using fetch api
    const response = await fetch(url);

    if (!response.ok) {
      return { success: false, message: 'Error fetching purchases' };
    }

    // Get response body
    const data = await response.json();

    // Return response body
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

    // Fetch URL using fetch api
    const response = await fetch(url);

    if (!response.ok) {
      return { success: false, message: 'Error fetching purchases' };
    }

    // Get response body
    const data = await response.json();

    // Return response body
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

    // Fetch URL using fetch api
    const response = await fetch(url);

    if (!response.ok) {
      return { success: false, message: 'Error fetching purchases' };
    }

    // Get response body
    const data = await response.json();

    // Return response body
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

    // Fetch URL using fetch api
    const response = await fetch(url);

    if (!response.ok) {
      return { success: false, message: 'Error fetching purchases' };
    }

    // Get response body
    const data = await response.json();

    // Return response body
    return data;
  },
});
