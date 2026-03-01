import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { lokaliseAuth } from '../common/auth';
import { keyIdProp, projectDropdown } from '../common/props';

export const createComment = createAction({
  auth: lokaliseAuth,
  name: 'createComment',
  displayName: 'Create Comment',
  description: 'Add comments to a key in your Lokalise project',
  props: {
    projectId: projectDropdown,
    keyId: keyIdProp,
    comment: Property.LongText({
      displayName: 'Comment',
      description: 'The comment text to add to the key',
      required: true,
    }),
  },
  async run(context) {
    const { projectId, keyId, comment } = context.propsValue;

    const body = {
      comments: [
        {
          comment,
        },
      ],
    };

    const path = `/projects/${projectId}/keys/${keyId}/comments`;
    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      path,
      body
    );

    return response;
  },
});
