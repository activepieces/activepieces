import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { CartloomAuthType } from './auth';

type KeyValuePair = { [key: string]: string | boolean | number | undefined };

const cartloomAPI = async (
  api: string,
  auth: CartloomAuthType,
  body: KeyValuePair = {}
) => {
  const request: HttpRequest = {
    method: HttpMethod.POST,
    url: `https://${auth.domain}.cartloom.com/api${api}`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-API-KEY': auth.apiKey,
    },
    body: body,
  };
  const response = await httpClient.sendRequest(request);

  if (response.status !== 200) {
    throw new Error(`Cartloom API Error: ${response.status} ${response.body}`);
  }

  let data = Object.keys(response.body).map((key) => response.body[key]);

  const arrayTest = response.body['0'];
  if (typeof arrayTest === 'undefined') {
    // when response is an object, it is wrapped in an array
    data = [response.body];
  }

  return {
    success: true,
    data: data,
  };
};

export async function getProducts(auth: CartloomAuthType) {
  return cartloomAPI('/products/list', auth);
}

export async function getAllDiscounts(auth: CartloomAuthType) {
  return cartloomAPI('/discounts/list', auth);
}

export async function getDiscount(auth: CartloomAuthType, discountId: string) {
  return cartloomAPI('/discounts/get', auth, { id: discountId });
}

export async function getOrder(auth: CartloomAuthType, invoice: string) {
  return cartloomAPI('/orders/get', auth, { invoice: invoice });
}

export async function getOrdersByDate(
  auth: CartloomAuthType,
  data: KeyValuePair
) {
  return cartloomAPI('/orders/list', auth, data);
}

export async function createDiscount(
  auth: CartloomAuthType,
  data: KeyValuePair
) {
  return cartloomAPI('/discounts/add', auth, data);
}
