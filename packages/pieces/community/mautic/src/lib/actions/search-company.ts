import { createAction } from '@activepieces/pieces-framework';
import { mauticCommon, searchEntity } from '../common';
import { mauticAuth } from '../..';

export const searchCompany = createAction({
  auth: mauticAuth,
  description: 'Search for a company in Mautic CRM', // Must be a unique across the piece, this shouldn't be changed.
  displayName: 'Search Company',
  name: 'search_mautic_company',
  props: {
    fields: mauticCommon.companyFields,
  },
  run: async function (context) {
    const { base_url, username, password } = context.auth;
    const url =
      (base_url.endsWith('/') ? base_url : base_url + '/') + 'api/companies';
    const fields = context.propsValue.fields;
    const keys = Object.keys(fields);
    let searchParams = '?';
    for (const key of keys) {
      if (fields[key]) {
        searchParams += `search=${key}:${fields[key]}&`;
      }
    }
    const response = await searchEntity(url, searchParams, username, password);
    return Object.values(response.body.companies)[0];
  },
});
