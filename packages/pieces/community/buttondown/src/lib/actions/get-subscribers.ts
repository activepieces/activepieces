import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { buttondownAuth } from '../../index';
import { buttondownRequest, ButtondownPaginatedResponse, ButtondownSubscriber } from '../common/client';

export const getSubscribers = createAction({
  name: 'get_subscribers',
  displayName: 'Get Subscribers',
  description: 'Retrieve a list of your newsletter subscribers.',
  auth: buttondownAuth,
  props: {},
  async run({ auth }) {
    return buttondownRequest<ButtondownPaginatedResponse<ButtondownSubscriber>>(
      auth, HttpMethod.GET, '/subscribers'
    );
  },
});
