import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { lokaliseAuth } from '../common/auth';
import { projectDropdown, keyIdProp } from '../common/props';

export const retrieveAComment = createAction({
  auth: lokaliseAuth,
  name: 'retrieveAComment',
  displayName: 'Retrieve a comment',
  description: 'Retrieve a specific comment on a key in your Lokalise project',
  props: {
    projectId: projectDropdown,
    keyId: keyIdProp,
    commentId: Property.ShortText({
      displayName: 'Comment ID',
      description: 'Unique identifier of the comment',
      required: true,
    }),
  },
  async run(context) {
    const { projectId, keyId, commentId } = context.propsValue;

    const path = `/projects/${projectId}/keys/${keyId}/comments/${commentId}`;
    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.GET,
      path
    );

    return response;
  },
});
