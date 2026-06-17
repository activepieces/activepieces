import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { sendrAuth } from '../auth';
import {  flattenObject } from '../common';

export const getUserInfo = createAction({
  auth: sendrAuth,
  name: 'get_user_info',
  displayName: 'Get Account Info',
  description: 'Returns information about the currently connected Sendr API user. Useful for verifying that your API key is valid.',
  audience: 'both',
  aiMetadata: { description: 'Fetches the Sendr account/seat tied to the connected API key. Use it to verify the connection is valid or to read the current user identity before other Sendr calls. Read-only; takes no input.', idempotent: true },
  props: {},
  async run(context) {
    const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url:  'https://api.sendr.io/seat/me',
            headers: { Authorization: `Bearer ${context.auth.secret_text}` },
          });
    return flattenObject(response.body);
  },
});
