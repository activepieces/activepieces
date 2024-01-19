import { createAction } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { mauticCommon } from '../common';
import { mauticAuth } from '../..';

export const updateCompany = createAction({
  auth: mauticAuth,
  description: 'Update a company in Mautic CRM', // Must be a unique across the piece, this shouldn't be changed.
  displayName: 'Update Company With Contact Id',
  name: 'update_mautic_company',
  props: {
    id: mauticCommon.id,
    fields: mauticCommon.companyFields,
  },
  run: async function (context) {
    const { base_url, username, password } = context.auth;
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
