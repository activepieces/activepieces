import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { zagomailAuth } from '../../index';

export const createSubscriberAction = createAction({
  auth: zagomailAuth,
  name: 'create_subscriber',
  displayName: 'Create Subscriber',
  description: 'Create a new subscriber in a list',
  props: {
    listId: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list to add the subscriber to',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the subscriber',
      required: true,
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
    const payload = {
      email: propsValue.email,
      fname: propsValue.firstName,
      lname: propsValue.lastName,
    };

    return await makeRequest(
      auth as string,
      HttpMethod.POST,
      `/lists/subscriber-create?list_uid=${propsValue.listId}`,
      payload
    );
  },
});
