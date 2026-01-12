import { createAction, Property } from '@activepieces/pieces-framework';
import { openmicAiAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';

export const findCall = createAction({
  auth: openmicAiAuth,
  name: 'findCall',
  displayName: 'Find Call',
  description: 'Retrieve details of a specific call by its ID',
  props: {
    callId: Property.ShortText({
      displayName: 'Call ID',
      description: 'The unique identifier of the call',
      required: true,
    }),
  },
  async run(context) {
    const response = await makeRequest(
      context.auth,
      HttpMethod.GET,
      `/call/${context.propsValue.callId}`
    );

    return response;
  },
});
