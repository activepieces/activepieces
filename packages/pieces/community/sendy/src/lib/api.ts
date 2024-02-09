import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { SendyAuthType } from './auth';

type KeyValuePair = { [key: string]: string | boolean | undefined };

const isSuccess = (text: string) => {
  // The following terms are found in success messages from the Sendy API
  const terms = [
    'created',
    'scheduled',
    'subscribed',
    'unconfirmed',
    'bounced',
    'complained',
    'true',
    '1',
  ];
  const lowercase = text.toLowerCase();
  return terms.some((term) => lowercase.includes(term.toLowerCase()));
};

const sendyPostAPI = async (
  api: string,
  auth: SendyAuthType,
  body: KeyValuePair = {}
) => {
  const { apiKey, domain, brandId } = auth;

  body['api_key'] = apiKey;
  body['brand_id'] = brandId;

  const request: HttpRequest = {
    method: HttpMethod.POST,
    url: `${domain}${api}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body,
  };
  const response = await httpClient.sendRequest(request);

  let data = [];
  let success = false;
  let text = 'Success';

  // If the response is a JSON object, then we know that the request was successful
  if (typeof response.body === 'object') {
    data = Object.keys(response.body).map((key) => response.body[key]);
    success = true;
  } else {
    text = response.body as string;
    if (isSuccess(text.toString())) success = true;
  }

  return {
    success: success,
    text: text,
    data: data,
  };
};

export async function getBrands(auth: SendyAuthType) {
  const api = '/api/brands/get-brands.php';
  return sendyPostAPI(api, auth);
}

export async function getLists(auth: SendyAuthType, data: KeyValuePair = {}) {
  const api = '/api/lists/get-lists.php';
  return sendyPostAPI(api, auth, data);
}

export async function subscribe(auth: SendyAuthType, data: KeyValuePair) {
  const api = '/subscribe';
  data['boolean'] = 'true'; // plain text response
  return sendyPostAPI(api, auth, data);
}

export async function subscribeMultiple(
  auth: SendyAuthType,
  data: KeyValuePair
) {
  const api = '/subscribe';
  data['boolean'] = 'true'; // plain text response
  return sendyPostAPI(api, auth, data);
}

export async function unsubscribe(auth: SendyAuthType, data: KeyValuePair) {
  const api = '/unsubscribe';
  data['boolean'] = 'true'; // plain text response
  return sendyPostAPI(api, auth, data);
}

// delete is a reserved word
export async function deleteSubscriber(
  auth: SendyAuthType,
  data: KeyValuePair
) {
  const api = '/api/subscribers/delete.php';
  return sendyPostAPI(api, auth, data);
}

export async function status(auth: SendyAuthType, data: KeyValuePair) {
  const api = '/api/subscribers/subscription-status.php';
  return sendyPostAPI(api, auth, data);
}

export async function count(auth: SendyAuthType, data: KeyValuePair) {
  const api = '/api/subscribers/active-subscriber-count.php';
  const response = await sendyPostAPI(api, auth, data);
  if (typeof response.text === 'number') response.success = true;
  return response;
}

export async function createCampaign(auth: SendyAuthType, data: KeyValuePair) {
  const api = '/api/campaigns/create.php';
  return sendyPostAPI(api, auth, data);
}
