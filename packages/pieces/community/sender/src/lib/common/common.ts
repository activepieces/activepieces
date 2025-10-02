import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';

export const senderAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description: 'Enter your Sender API Token',
  required: true,
});

const SENDER_API_BASE_URL = 'https://api.sender.net/v2';

export async function makeSenderRequest(
  auth: string,
  endpoint: string,
  method: HttpMethod = HttpMethod.GET,
  body?: any
) {
  return await httpClient.sendRequest({
    method,
    url: `${SENDER_API_BASE_URL}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body,
  });
}