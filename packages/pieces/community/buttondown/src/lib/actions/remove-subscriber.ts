import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { buttondownAuth } from '../../index';
import { buttondownRequest } from '../common/client';

export const removeSubscriber = createAction({
  name: 'remove_subscriber',
  displayName: 'Remove Subscriber',
  description: 'Unsubscribe a subscriber by their ID.',
  auth: buttondownAuth,
  props: {
    subscriberId: Property.ShortText({
      displayName: 'Subscriber ID',
      description: 'The subscriber ID to remove. Use Get Subscribers to find it.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { subscriberId } = propsValue;
    return buttondownRequest(auth, HttpMethod.DELETE, `/subscribers/${subscriberId}`);
  },
});
