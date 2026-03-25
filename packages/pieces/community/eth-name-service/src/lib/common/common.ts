import {
  PieceAuth,
} from '@activepieces/pieces-framework';

export const ensCommon = {
  auth: PieceAuth.SecretText({
    displayName: 'API Key',
    description: '*Get your api Key: https://thegraph.com/studio/apikeys',
    required: true,
  }),
  apiCall: async function (
    url: string,
    method: string,
    data: object | undefined = undefined,
    token: string | undefined = undefined
  ) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    return response.json();
  },
};
