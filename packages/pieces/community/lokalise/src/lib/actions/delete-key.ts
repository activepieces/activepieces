import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { lokaliseAuth } from '../common/auth';
import { projectDropdown, keyIdProp } from '../common/props';

export const deleteKey = createAction({
  auth: lokaliseAuth,
  name: 'deleteKey',
  displayName: 'Delete Key',
  description:
    'Delete a key from your Lokalise project (software and marketing projects only)',
  props: {
    projectId: projectDropdown,
    keyId: keyIdProp,
  },
  async run(context) {
    const { projectId, keyId } = context.propsValue;

    const path = `/projects/${projectId}/keys/${keyId}`;
    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.DELETE,
      path
    );

    return response;
  },
});
