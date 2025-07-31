import { createAction, Property } from '@activepieces/pieces-framework';
import { aircallAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { callIdDropdown } from '../common/props';

export const tagACall = createAction({
  auth: aircallAuth,
  name: 'tagACall',
  displayName: 'Tag a Call',
  description: 'Add tags to a specific call in Aircall',
  props: {
    callId: callIdDropdown,
    tags: Property.Array({
      displayName: 'Tag IDs',
      description: 'Array of Tag IDs to apply to the call',
      required: true,
      properties: {
        tagId: Property.Number({
          displayName: 'Tag ID',
          description: 'The unique identifier of the tag',
          required: true,
        }),
      },
    }),
  },
  async run(context) {
    const { callId, tags } = context.propsValue;
    const accessToken = context.auth.access_token;

    // Extract tag IDs from the array
    const tagIds = tags.map((tag: any) => tag.tagId);

    const response = await makeRequest(
      accessToken,
      HttpMethod.POST,
      `/calls/${callId}/tags`,
      { tags: tagIds }
    );

    return {
      status: 'success',
      message: `Tags added successfully to call ${callId}`,
      data: response,
    };
  },
});
