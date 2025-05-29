import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = 'https://www.cognitoforms.com/api';

export async function makeRequest(
  apiKey: string,
  method: HttpMethod,
  path: string,
  body?: unknown
) {
  const response = await httpClient.sendRequest({
    method,
    url: `${BASE_URL}${path}`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body,
  });

  return response.body;
}

export async function fetchForms(apiKey: string) {
  return await makeRequest(apiKey, HttpMethod.GET, '/forms');
}

export async function fetchFormFields(apiKey: string, formId: string) {
  const form = await makeRequest(apiKey, HttpMethod.GET, `/forms/${formId}`);
  return form.Fields || [];
}
