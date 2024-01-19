import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { BonjoroAuthType } from './auth';

export type KeyValuePair = {
  [key: string]: string | boolean | object | undefined;
};

const bonjoroAPI = async (
  api: string,
  auth: BonjoroAuthType,
  method: HttpMethod = HttpMethod.GET,
  body: KeyValuePair = {}
) => {
  const baseUrl = 'https://www.bonjoro.com/api/v2/';
  const request: HttpRequest = {
    body: body,
    method: method,
    url: `${baseUrl}${api}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.apiKey}`,
    },
  };
  const response = await httpClient.sendRequest(request);

  if (response.status > 201 || response.body['data'] === undefined) {
    throw new Error(`Bonjoro API error: ${response.status} ${response.body}`);
  }

  let data = [];
  data = response.body['data'];

  return {
    success: true,
    data: data,
  };
};

export async function getUsers(auth: BonjoroAuthType) {
  const api = 'users';
  return bonjoroAPI(api, auth);
}

export async function getCampaigns(auth: BonjoroAuthType) {
  const api = 'campaigns';
  return bonjoroAPI(api, auth);
}

export async function getTemplates(auth: BonjoroAuthType) {
  const api = 'message-templates';
  return bonjoroAPI(api, auth);
}

export async function addGreet(auth: BonjoroAuthType, data: KeyValuePair) {
  const api = 'greets';
  return bonjoroAPI(api, auth, HttpMethod.POST, data);
}

export async function addProfile(auth: BonjoroAuthType, data: KeyValuePair) {
  const api = 'profiles';
  return bonjoroAPI(api, auth, HttpMethod.POST, data);
}
