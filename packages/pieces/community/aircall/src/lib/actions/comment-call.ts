import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { aircallAuth } from '../common/auth';
import { makeClient } from '../common/client';

export const commentCallAction = createAction({
  auth: aircallAuth,
  name: 'comment_call',
  displayName: 'Comment a Call',
  description: 'Add an internal comment to a call',
  props: {
    callId: Property.Number({
      displayName: 'Call ID',
      description: 'The ID of the call to comment on',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Comment',
      description: 'The comment content',
      required: true,
    }),
  },
  async run(context) {
    // Validate inputs
    if (!context.propsValue.callId || context.propsValue.callId <= 0) {
      throw new Error('Call ID must be a positive number');
    }

    if (!context.propsValue.content || context.propsValue.content.trim().length === 0) {
      throw new Error('Comment content cannot be empty');
    }

    if (context.propsValue.content.length > 1000) {
      throw new Error('Comment content cannot exceed 1000 characters');
    }

    const client = makeClient({
      apiToken: context.auth.apiToken,
      baseUrl: context.auth.baseUrl || 'https://api.aircall.io/v1',
    });

    try {
      const response = await client.makeRequest({
        method: HttpMethod.POST,
        url: `/calls/${context.propsValue.callId}/comments`,
        body: {
          content: context.propsValue.content.trim(),
        },
      });

      return response;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`Call with ID ${context.propsValue.callId} not found`);
      }
      if (error.response?.status === 400) {
        throw new Error('Invalid request. Please check your input parameters.');
      }
      throw new Error(`Failed to comment on call: ${error.message}`);
    }
  },
}); 