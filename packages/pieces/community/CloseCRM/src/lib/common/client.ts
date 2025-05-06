import axios from 'axios';
import { PieceAuth } from '@activepieces/pieces-framework';

export function makeClient(auth: PieceAuth.OAuth2AuthValue) {
  return axios.create({
    baseURL: auth.environment === 'sandbox' ? 
      'https://api-sandbox.close.com/api/v1' : 
      'https://api.close.com/api/v1',
    headers: {
      'Authorization': `Bearer ${auth.accessToken}`,
      'Content-Type': 'application/json',
    },
  });
}