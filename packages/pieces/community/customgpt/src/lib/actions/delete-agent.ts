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
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes a CustomGPT agent (project) identified by its project id, removing the agent and its conversations. Use when decommissioning an agent; this is destructive and cannot be undone. Not idempotent: repeating it after deletion targets a project that no longer exists.',
    idempotent: false,
  },
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
