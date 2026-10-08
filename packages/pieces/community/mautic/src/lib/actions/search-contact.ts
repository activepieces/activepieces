import { createAction } from '@activepieces/pieces-framework';
import { mauticAuth } from '../auth';
import { mauticApi } from '../common/api';
import { mauticProps } from '../common/props';
import { searchMauticContactOutputSchema } from '../output-schemas';

export const searchContactAction = createAction({
  auth: mauticAuth,
  description: 'Search for a contact in Mautic CRM',
  audience: 'human',
  aiMetadata: {
    description:
      'Look up a contact in Mautic by matching the supplied field values (each provided field becomes an exact-equality filter), returning the first matching contact. Use to find a contact or resolve its id before updating, or to verify whether someone already exists before creating one. Read-only and idempotent.',
    idempotent: true,
  },
  displayName: 'Search Contact',
  name: 'search_mautic_contact',
  outputSchema: searchMauticContactOutputSchema,
  classification: 'SEARCH',
  props: {
    fields: mauticProps.contactFields({ required: true }),
  },
  run: async function (context) {
    const response = await mauticApi.searchContacts({ auth: context.auth, fields: context.propsValue.fields });
    return Object.values(response.contacts)[0];
  },
});
