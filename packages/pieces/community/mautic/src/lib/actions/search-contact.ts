import { createAction } from '@activepieces/pieces-framework';
import { mauticCommon, searchEntity } from '../common';
import { mauticAuth } from '../..';

export const searchContact = createAction({
  auth: mauticAuth,
  description: 'Search for a contact in Mautic CRM', // Must be a unique across the piece, this shouldn't be changed.
  displayName: 'Search Contact',
  name: 'search_mautic_contact',
  props: {
    fields: mauticCommon.contactFields,
  },
  run: async function (context) {
    const { base_url, username, password } = context.auth;
    const url =
      (base_url.endsWith('/') ? base_url : base_url + '/') + 'api/contacts';
    const fields = context.propsValue.fields;
    const keys = Object.keys(fields);
    let count = 0;
    let searchParams = '?';
    for (const key of keys) {
      if (fields[key]) {
        searchParams += `where[${count}][col]=${key}&where[${count}][expr]=eq&where[${count}][val]=${fields[key]}&`;
        ++count;
      }
    }
    const response = await searchEntity(url, searchParams, username, password);
    return Object.values(response.body.contacts)[0];
  },
});
