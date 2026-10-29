import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { videogenAuth } from '../auth';

export const getAccount = createAction({
  auth: videogenAuth,
  name: 'get_account',
  displayName: 'Get Account',
  description: 'Read the account connected by the VideoGen API key.',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {description: 'Reads the connected VideoGen account without generating media or spending credits.', idempotent: true},
  props: {},
  async run({auth}) {
    const response = await httpClient.sendRequest({method: HttpMethod.GET, url: 'https://api.videogen.io/v1/account/me', headers: {Authorization: `Bearer ${auth.secret_text}`}});
    return response.body;
  },
});
