import { createAction } from '@activepieces/pieces-framework';
import { mauticCommon, searchEntity } from '../common';
import { mauticAuth } from '../auth';

export const searchContact = createAction({
  auth: mauticAuth,
  description: 'Search for a contact in Mautic CRM', // Must be a unique across the piece, this shouldn't be changed.
  audience: 'both',
  aiMetadata: {
    description:
      'Look up a contact in Mautic by matching the supplied field values (each provided field becomes an exact-equality filter), returning the first matching contact. Use to find a contact or resolve its id before updating, or to verify whether someone already exists before creating one. Read-only and idempotent.',
    idempotent: true,
  },
  displayName: 'Search Contact',
  name: 'search_mautic_contact',
  props: {
    fields: mauticCommon.contactFields,
  },
  run: async function (context) {
    const { base_url, username, password } = context.auth.props;
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
