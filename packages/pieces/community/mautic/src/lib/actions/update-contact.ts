import { createAction } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { mauticCommon } from '../common';
import { mauticAuth } from '../auth';

export const updateContact = createAction({
  auth: mauticAuth,
  description: 'Update a contact in Mautic CRM', // Must be a unique across the piece, this shouldn't be changed.
  audience: 'both',
  aiMetadata: {
    description:
      "Update an existing Mautic contact, identified by its numeric contact id, with the provided field values. Use when you already know the contact id (resolve it first with Search Contact if you only have an email or name). Idempotent: applying the same field values to the same id repeatedly leaves the contact in the same state.",
    idempotent: true,
  },
  displayName: 'Update Contact With Contact Id',
  name: 'update_mautic_contact',
  props: {
    id: mauticCommon.id,
    fields: mauticCommon.contactFields,
  },
  run: async function (context) {
    const { base_url, username, password } = context.auth.props;
    const request: HttpRequest = {
      method: HttpMethod.PATCH,
      url: `${base_url.endsWith('/') ? base_url : base_url + '/'}api/contacts/${
        context.propsValue.id
      }/edit`,
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
