import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { aircallAuth } from '../common/auth';
import { makeClient } from '../common/client';

export const getCallAction = createAction({
  auth: aircallAuth,
  name: 'get_call',
  displayName: 'Get Call',
  description: 'Fetches details about a call',
  props: {
    callId: Property.Number({
      displayName: 'Call ID',
      description: 'The ID of the call to retrieve',
      required: true,
    }),
  },
  async run(context) {
    // Validate inputs
    if (!context.propsValue.callId || context.propsValue.callId <= 0) {
      throw new Error('Call ID must be a positive number');
    }

    const client = makeClient({
      username: context.auth.username,
      password: context.auth.password,
      baseUrl: context.auth.baseUrl || 'https://api.aircall.io/v1',
    });

    try {
      const response = await client.makeRequest({
        method: HttpMethod.GET,
        url: `/calls/${context.propsValue.callId}`,
      });

      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response: { status: number } }).response;
        if (response.status === 404) {
          throw new Error(`Call with ID ${context.propsValue.callId} not found`);
        }
      }
      throw new Error(`Failed to get call: ${errorMessage}`);
    }
  },
}); 