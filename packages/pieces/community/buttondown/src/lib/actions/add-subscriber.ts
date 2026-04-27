import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { buttondownAuth } from '../../index';
import { buttondownRequest } from '../common/client';

export const addSubscriber = createAction({
  name: 'add_subscriber',
  displayName: 'Add Subscriber',
  description: 'Subscribe an email address to your newsletter.',
  auth: buttondownAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Email Address',
      required: true,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Optional tags to apply to this subscriber.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { email, tags } = propsValue;
    return buttondownRequest(auth, HttpMethod.POST, '/subscribers', {
      email,
      tags: tags ?? [],
    });
  },
});
