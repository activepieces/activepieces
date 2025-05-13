import { zagomailAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { zagoMailApiService } from '../common/request';

export const searchSubscriberByEmail = createAction({
  auth: zagomailAuth,
  name: 'searchSubscriberByEmail',
  displayName: 'Search Subscriber by Email',
  description: 'Find a subscriber by their email address',
  props: {
    listUId: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list the subscriber is in',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the subscriber you want to search for',
      required: true,
    }),
  },
  async run({propsValue, auth}) {
    const listUId = propsValue.listUId;
    const email = propsValue.email;

    return await zagoMailApiService.searchSubscriberByEmail(auth, listUId, {
      email
    })
  },
});
