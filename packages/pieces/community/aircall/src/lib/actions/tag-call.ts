import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { aircallAuth } from '../common/auth';
import { makeClient } from '../common/client';

export const tagCallAction = createAction({
  auth: aircallAuth,
  name: 'tag_call',
  displayName: 'Tag a Call',
  description: 'Assign a tag to a call',
  props: {
    callId: Property.Number({
      displayName: 'Call ID',
      description: 'The ID of the call to tag',
      required: true,
    }),
    tagId: Property.Number({
      displayName: 'Tag ID',
      description: 'The ID of the tag to assign',
      required: true,
    }),
  },
  async run(context) {
    // Validate inputs
    if (!context.propsValue.callId || context.propsValue.callId <= 0) {
      throw new Error('Call ID must be a positive number');
    }

    if (!context.propsValue.tagId || context.propsValue.tagId <= 0) {
      throw new Error('Tag ID must be a positive number');
    }

    const client = makeClient({
      apiToken: context.auth.apiToken,
      baseUrl: context.auth.baseUrl || 'https://api.aircall.io/v1',
    });

    try {
      const response = await client.makeRequest({
        method: HttpMethod.POST,
        url: `/calls/${context.propsValue.callId}/tags`,
        body: {
          tag_id: context.propsValue.tagId,
        },
      });

      return response;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`Call with ID ${context.propsValue.callId} or tag with ID ${context.propsValue.tagId} not found`);
      }
      if (error.response?.status === 400) {
        throw new Error('Invalid request. Please check your input parameters.');
      }
      if (error.response?.status === 409) {
        throw new Error('Call is already tagged with this tag.');
      }
      throw new Error(`Failed to tag call: ${error.message}`);
    }
  },
}); 