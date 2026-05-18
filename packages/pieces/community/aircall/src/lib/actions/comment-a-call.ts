import { createAction, Property } from '@activepieces/pieces-framework';
import { aircallAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { callIdDropdown } from '../common/props';

export const commentACall = createAction({
  auth: aircallAuth,
  name: 'commentACall',
  displayName: 'Comment a Call',
  description: 'Adds a comment (note) to a specific call.',
  props: {
    callId: callIdDropdown,
    content: Property.LongText({
      displayName: 'Comment Content',
      required: true,
    }),
  },
  async run(context) {
    const { callId, content } = context.propsValue;
    const auth = context.auth;

    const response = await makeRequest(
      auth,
      HttpMethod.POST,
      `/calls/${callId}/comments`,
      { content }
    );

    return {
      status: 'success',
      message: `Comment added successfully to call ${callId}.`,
      comment: content,
      data: response,
    };
  },
});
