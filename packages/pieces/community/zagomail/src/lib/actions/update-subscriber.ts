import { zagomailAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { zagoMailApiService } from '../common/request';

export const updateSubscriber = createAction({
  auth: zagomailAuth,
  name: 'updateSubscriber',
  displayName: 'Update Subscriber',
  description: 'Updates a subscriber',
  props: {
    listUId: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list the subscriber is in',
      required: true,
    }),
    subsriberUid: Property.ShortText({
      displayName: 'Subscriber ID',
      description: 'The ID of the subscriber you want to update',
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
    const subsriberUid = propsValue.subsriberUid;

    const payload = {
      email: propsValue.email!,
      fname: propsValue.firstName!,
      lname: propsValue.lastName!,
    };

    return await zagoMailApiService.updateSubscriber(
      auth,
      listUId,
      subsriberUid,
      payload
    );
  },
});
