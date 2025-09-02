import { BROWSERLESS_BASE_URL } from './constants';

export const makeRequest = async (endpoint: string, token: string, body?: any) => {
  const response = await fetch(`${BROWSERLESS_BASE_URL}${endpoint}?token=${token}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Browserless API error: ${errorText}`);
  }

  return response;
};

export const handleBinaryResponse = async (response: Response) => {
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
};
