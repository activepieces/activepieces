import { Property } from '@activepieces/pieces-framework';

export const BASE_URL = 'https://api.bookedin.ai/api/v1';

export const getBookedinHeaders = (apiKey: string) => {
  return {
    'X-API-Key': apiKey,
    'accept': 'application/json',
  };
};