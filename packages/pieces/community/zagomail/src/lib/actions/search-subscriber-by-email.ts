import { zagomailAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { zagoMailApiService } from '../common/request';
import { listUId } from '../common/props';

export const searchSubscriberByEmail = createAction({
  auth: zagomailAuth,
  name: 'searchSubscriberByEmail',
  displayName: 'Search Subscriber',
  description: 'Finds a subscriber by their email address.',
  props: {
    listUId: listUId,
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const listUId = propsValue.listUId;
    const email = propsValue.email;

    const response = await zagoMailApiService.searchSubscriberByEmail(
      auth,
      listUId,
      {
        email,
      }
    );

    return {
      found: response.status === 'success',
      result: response.data ?? null,
    };
  },
});
