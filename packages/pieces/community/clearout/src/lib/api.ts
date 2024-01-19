import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { ClearoutAuthType } from './auth';

export type KeyValuePair = {
  [key: string]: string | boolean | object | undefined;
};

const clearoutAPI = async (
  api: string,
  auth: ClearoutAuthType,
  method: HttpMethod = HttpMethod.GET,
  body: KeyValuePair = {}
) => {
  const baseUrl = 'https://api.clearout.io/v2/';
  const request: HttpRequest = {
    body: body,
    method: method,
    url: `${baseUrl}${api}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${auth.apiKey}`,
    },
  };
  const response = await httpClient.sendRequest(request);

  if (response.status !== 200) {
    throw new Error(`Bonjoro API error: ${response.status} ${response.body}`);
  }

  let data = [];
  data = response.body['data'];

  return {
    success: true,
    data: data,
  };
};

export async function getCredits(auth: ClearoutAuthType) {
  const api = 'email_verify/getcredits';
  return clearoutAPI(api, auth);
}

export async function instantVerify(
  auth: ClearoutAuthType,
  data: KeyValuePair
) {
  const api = 'email_verify/instant';
  return clearoutAPI(api, auth, HttpMethod.POST, data);
}
