import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { krispcallAuth } from '../auth';

export const deleteContacts = createAction({
  name: 'deleteContacts',
  displayName: 'Delete Contacts',
  auth: krispcallAuth,
  description: 'Delete contacts from krispcall.',
  audience: 'both',
  aiMetadata: {
    description:
      'Delete one or more contacts from the connected KrispCall account, given a list of contacts to remove. Use when an agent needs to clean up or remove KrispCall contacts. Idempotent in effect — re-running after the contacts are gone leaves the account in the same state.',
    idempotent: true,
  },
  props: {
    contacts: Property.Array({
      displayName: 'Contacts',
      description: 'Enter contact which you want to delete.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const res = await httpClient.sendRequest<string[]>({
      method: HttpMethod.DELETE,
      url: 'https://app.krispcall.com/api/v3/platform/activepiece/delete-contacts',
      headers: {
        'X-API-KEY': auth.props.apiKey,
      },
      body: {
        contacts: propsValue.contacts,
      },
    });
    return res.body;
  },
});
