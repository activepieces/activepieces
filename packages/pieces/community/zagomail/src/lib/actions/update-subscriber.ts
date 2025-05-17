import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { zagomailAuth } from '../../index';
import { buildListsDropdown } from '../common/props';

export const updateSubscriberAction = createAction({
  auth: zagomailAuth,
  name: 'update_subscriber',
  displayName: 'Update Subscriber',
  description: 'Update an existing subscriber',
  props: {
    listId: Property.Dropdown({
      displayName: 'List',
      description: 'Select the list the subscriber belongs to',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => await buildListsDropdown(auth as string),
    }),
    subscriberId: Property.ShortText({
      displayName: 'Subscriber ID',
      description: 'The ID of the subscriber to update',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the subscriber',
      required: false,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'The first name of the subscriber',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'The last name of the subscriber',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const payload: Record<string, unknown> = {
      email: propsValue.email,
      fname: propsValue.firstName,
      lname: propsValue.lastName,
    };

    // Remove undefined values
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    return await makeRequest(
      auth as string,
      HttpMethod.POST,
      `/lists/subscriber-update?list_uid=${propsValue.listId}&subscriber_uid=${propsValue.subscriberId}`,
      payload
    );
  },
});
