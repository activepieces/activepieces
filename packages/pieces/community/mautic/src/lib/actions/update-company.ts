import { createAction } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { mauticCommon } from '../common';
import { mauticAuth } from '../auth';

export const updateCompany = createAction({
  auth: mauticAuth,
  description: 'Update a company in Mautic CRM', // Must be a unique across the piece, this shouldn't be changed.
  audience: 'both',
  aiMetadata: {
    description:
      'Update an existing Mautic company, identified by its numeric company id, with the provided field values (empty fields are dropped so they are left unchanged). Use when you already know the company id (resolve it first with Search Company if you only have a name). Idempotent: applying the same field values to the same id repeatedly leaves the company in the same state.',
    idempotent: true,
  },
  displayName: 'Update Company With Contact Id',
  name: 'update_mautic_company',
  props: {
    id: mauticCommon.id,
    fields: mauticCommon.companyFields,
  },
  run: async function (context) {
    const { base_url, username, password } = context.auth.props;
    // This is intentionally done because for `null` data Mautic doesn't change data for contacts but
    // for the same it changes data for companies. This step is taken to ensure both behave the same.
    const fields = context.propsValue.fields;
    const keys = Object.keys(fields);
    for (const key of keys) {
      if (!fields[key]) {
        delete fields[key];
      }
    }
    const request: HttpRequest = {
      method: HttpMethod.PATCH,
      url: `${
        base_url.endsWith('/') ? base_url : base_url + '/'
      }api/companies/${context.propsValue.id}/edit`,
      body: JSON.stringify(fields),
      headers: {
        Authorization:
          'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
        'Content-Type': 'application/json',
      },
    };
    return await httpClient.sendRequest(request);
  },
});
