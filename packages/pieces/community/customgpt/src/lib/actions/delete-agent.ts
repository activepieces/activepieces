import { createAction } from '@activepieces/pieces-framework';
import { projectId } from '../common/props';
import { customgptAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const deleteAgent = createAction({
  auth: customgptAuth,
  name: 'deleteAgent',
  displayName: 'Delete Agent',
  description: 'Delete a CustomGPT agent',
  props: {
    projectId: projectId,
  },
  async run(context) {
    const { projectId } = context.propsValue;

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.DELETE,
      `/projects/${projectId}`
    );

    return response;
  },
});
