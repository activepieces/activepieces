import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { cognitoFormsAuth } from '../..';

export const BASE_URL = 'https://www.cognitoforms.com/api';

export async function makeRequest(
  {secret_text}: AppConnectionValueForAuthProperty<typeof cognitoFormsAuth>,
  method: HttpMethod,
  path: string,
  body?: unknown
) {
  const response = await httpClient.sendRequest({
    method,
    url: `${BASE_URL}${path}`,
    headers: {
      Authorization: `Bearer ${secret_text}`,
      'Content-Type': 'application/json',
    },
    body,
  });

  return response.body;
}
