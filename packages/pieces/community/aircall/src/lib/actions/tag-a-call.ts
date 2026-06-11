import { createAction } from '@activepieces/pieces-framework';
import { aircallAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { callIdDropdown, tagIdDropdown } from '../common/props';

export const tagACall = createAction({
  auth: aircallAuth,
  name: 'tagACall',
  displayName: 'Tag a Call',
  description: 'Add tags to a specific call.',
  audience: 'both',
  aiMetadata: { description: 'Applies one or more existing tags (by tag ID) to an Aircall call identified by its call ID. Use to categorize or label a call. The supplied tag set replaces the call\'s current tags, so passing the same tags again leaves the result unchanged; effectively idempotent for a given tag set.', idempotent: true },
  props: {
    callId: callIdDropdown,
    tags: tagIdDropdown,
  },
  async run(context) {
    const { callId, tags } = context.propsValue;
   

    const response = await makeRequest(
       context.auth,
      HttpMethod.POST,
      `/calls/${callId}/tags`,
      { tags }
    );

    return {
      status: 'success',
      message: `Tags added successfully to call ${callId}.`,
      data: response,
    };
  },
});
