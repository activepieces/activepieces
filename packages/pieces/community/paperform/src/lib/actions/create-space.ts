import { createAction, Property } from '@activepieces/pieces-framework';
import { PaperformAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createSpace = createAction({
  auth: PaperformAuth,
  name: 'createSpace',
  displayName: 'Create Space',
  description: 'Create a new space in Paperform',
  props: {
    name: Property.ShortText({
      displayName: 'Space Name',
      description: 'The name of the space',
      required: true,
    }),
  },
  async run(context) {
    const { name } = context.propsValue;
    const apiKey = context.auth as string;

    const response = await makeRequest(apiKey, HttpMethod.POST, '/spaces', {
      name,
    });

    return {
      success: true,
      message: `Successfully created space "${name}"`,
      space: response.results.space,
    };
  },
});
