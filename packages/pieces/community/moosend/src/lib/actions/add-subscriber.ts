import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { moosendAuth } from '../../index';
import { moosendRequest } from '../common/client';

export const addSubscriber = createAction({
  name: 'add_subscriber',
  displayName: 'Add Subscriber',
  description: 'Add a new subscriber to a mailing list.',
  auth: moosendAuth,
  props: {
    mailingListId: Property.ShortText({
      displayName: 'Mailing List ID',
      description: 'The ID of the mailing list.',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email Address',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Full Name',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { mailingListId, email, name } = propsValue;
    return moosendRequest(auth, HttpMethod.POST, `/subscribers/${mailingListId}/subscribe.json`, {
      Email: email,
      Name: name ?? '',
    });
  },
});
