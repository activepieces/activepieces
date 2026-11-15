import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typeformAuth } from '../auth';
import { typeformCommon, TypeformRecord } from '../common';
import { workspaceOutputSchema } from '../output-schemas';

export const getWorkspaceAction = createAction({
  auth: typeformAuth,
  name: 'get_workspace',
  classification: 'READ',
  displayName: 'Get Workspace',
  description: 'Gets a workspace with its members.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Get one Typeform workspace by ID with its name, account ID, default and shared flags, form count and members with their roles. Use List Forms with this workspace to see its forms. Read-only.',
    idempotent: true,
  },
  outputSchema: workspaceOutputSchema,
  props: {
    workspace: typeformCommon.requiredWorkspaceId,
  },
  async run({ auth, propsValue }) {
    return typeformCommon.typeformRequest<TypeformRecord>({
      token: auth.access_token,
      method: HttpMethod.GET,
      path: `/workspaces/${encodeURIComponent(propsValue.workspace)}`,
    });
  },
});
