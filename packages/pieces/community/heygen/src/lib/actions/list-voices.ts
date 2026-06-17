import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { heygenApiCall } from '../common/client';
import { heygenAuth } from '../common/auth';

export const listVoicesAction = createAction({
  auth: heygenAuth,
  name: 'list_voices',
  displayName: 'List Voices',
  description: 'Retrieve a list of all available voices.',
  audience: 'both',
  aiMetadata: {
    description: 'Retrieves all voices available to the account. Use to discover voice IDs before composing or generating a video. Takes no input; read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    return await heygenApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: '/voices',
      apiVersion: 'v2',
    });
  },
});
