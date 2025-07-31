import { createAction, Property } from '@activepieces/pieces-framework';
import { aircallAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { callIdDropdown } from '../common/props';
import { stat } from 'fs';

export const commentACall = createAction({
  auth: aircallAuth,
  name: 'commentACall',
  displayName: 'Comment a Call',
  description: 'Add a comment (note) to a specific call in Aircall',
  props: {
    callId: callIdDropdown,
    content: Property.LongText({
      displayName: 'Comment Content',
      description: 'The content of the comment to add to the call',
      required: true,
    }),
  },
  async run(context) {
    const { callId, content } = context.propsValue;
    const accessToken = context.auth.access_token;

    const response = await makeRequest(
      accessToken,
      HttpMethod.POST,
      `/calls/${callId}/comments`,
      { content }
    );

    return {
      status: 'success',
      message: `Comment added successfully to call ${callId}`,
      data: response,
    };
  },
});
