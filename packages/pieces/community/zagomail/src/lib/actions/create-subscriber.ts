import { zagomailAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { zagoMailApiService } from '../common/request';

export const createSubscriber = createAction({
  auth: zagomailAuth,
  name: 'createSubscriber',
  displayName: 'Create Subscriber',
  description: 'Create a new subscriber in a list',
  props: {
    listUId: Property.ShortText({
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
    const listUId = propsValue.listUId;
    const payload = {
      email: propsValue.email!,
      fname: propsValue.firstName!,
      lname: propsValue.lastName!,
    };

    return await zagoMailApiService.createSubscriber(auth, listUId, payload);
  },
});
