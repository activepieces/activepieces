import { createAction } from '@activepieces/pieces-framework';
import { sentAuth } from '../auth';
import { sentApi } from '../common/api';
import { sentProps } from '../common/props';
import { sentValues } from '../common/values';

export const getContact = createAction({
  auth: sentAuth,
  name: 'get_contact',
  classification: 'READ',
  displayName: 'Get Contact',
  description: 'Get details of a contact by its Sent contact ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Read a known contact. To find contacts by phone or search term, use List Contacts. Safe to retry.',
    idempotent: true,
  },
  props: { contact_id: sentProps.contactId, profile_id: sentProps.profile },
  run: async ({ auth, propsValue }) =>
    sentApi.request({
      apiKey: auth.secret_text,
      path: `/contacts/${encodeURIComponent(
        sentValues.requiredString({
          value: propsValue.contact_id,
          label: 'Get Contact ID',
        })
      )}`,
      profileId: propsValue.profile_id,
    }),
});
