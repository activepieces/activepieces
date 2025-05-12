import axios from 'axios';
import { PieceAuth, Property, createAction } from '@activepieces/pieces-framework';

// Then create your client function
export function makeClient(auth: { environment: string, apiKey: string }): any {
  return axios.create({
    baseURL: auth.environment === 'sandbox' ? 
      'https://api-sandbox.close.com/api/v1' : 
      'https://api.close.com/api/v1',
    headers: {
      'Authorization': `Bearer ${auth.apiKey}`,
      'Content-Type': 'application/json',
    },
  });
}