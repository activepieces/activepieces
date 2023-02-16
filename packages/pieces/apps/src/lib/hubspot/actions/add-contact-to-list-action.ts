import { hubSpotAuthentication, hubSpotListIdDropdown } from '../common/props';
import { hubSpotClient } from '../common/client';
import { createAction, Property, assertNotNullOrUndefined } from '@activepieces/framework';

export const hubSpotListsAddContactAction = createAction({
  name: 'add_contact_to_list',
  displayName: 'Add contact to list',
  description: 'Add contact to list',
  sampleData: {
    'updated': [12345],
    'discarded': [12345],
    'invalidVids': [12345],
    'invalidEmails': ['hello@example.com'],
  },
  props: {
    authentication: hubSpotAuthentication,
    listId: hubSpotListIdDropdown,
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Contact email',
      required: true,
    }),
  },

  async run(context) {
    const token = context.propsValue.authentication?.access_token;
    const { listId, email } = context.propsValue;

    assertNotNullOrUndefined(token, 'token');
    assertNotNullOrUndefined(listId, 'list');
    assertNotNullOrUndefined(email, 'email');

    return await hubSpotClient.lists.addContact({
      token,
      listId,
      email,
    });
  },
});
