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
  audience: 'both',
  aiMetadata: { description: 'Appends a free-text comment (note) to an Aircall call identified by its call ID. Use to annotate a call with context after it happens. Not idempotent: each call adds a new comment, so repeating it duplicates the note.', idempotent: false },
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
