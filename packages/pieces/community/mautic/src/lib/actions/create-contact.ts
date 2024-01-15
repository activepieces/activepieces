import { createAction } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { mauticCommon } from '../common';
import { mauticAuth } from '../..';

export const createContact = createAction({
  auth: mauticAuth,
  description: 'Creates a new contact in Mautic CRM', // Must be a unique across the piece, this shouldn't be changed.
  displayName: 'Create Contact',
  name: 'create_mautic_contact',
  props: {
    fields: mauticCommon.contactFields,
  },
  run: async function (context) {
    const { base_url, username, password } = context.auth;
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url:
        (base_url.endsWith('/') ? base_url : base_url + '/') +
        'api/contacts/new',
      body: JSON.stringify(context.propsValue.fields),
      headers: {
        Authorization:
          'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
        'Content-Type': 'application/json',
      },
    };
    return await httpClient.sendRequest(request);
  },
});
