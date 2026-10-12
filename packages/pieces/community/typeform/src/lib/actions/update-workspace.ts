import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typeformAuth } from '../auth';
import { typeformCommon, TypeformRecord } from '../common';
import { workspaceOutputSchema } from '../output-schemas';

export const updateWorkspaceAction = createAction({
  auth: typeformAuth,
  name: 'update_workspace',
  classification: 'WRITE',
  displayName: 'Rename Workspace',
  description: 'Renames a workspace.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Rename a Typeform workspace. Its forms and members are unchanged. Returns the updated workspace.',
    idempotent: true,
  },
  outputSchema: workspaceOutputSchema,
  props: {
    workspace: typeformCommon.requiredWorkspaceId,
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { workspace, name } = propsValue;
    const path = `/workspaces/${encodeURIComponent(workspace)}`;
    await typeformCommon.typeformRequest<unknown>({
      token: auth.access_token,
      method: HttpMethod.PATCH,
      path,
      body: [{ op: 'replace', path: '/name', value: name }],
    });
    return typeformCommon.typeformRequest<TypeformRecord>({
      token: auth.access_token,
      method: HttpMethod.GET,
      path,
    });
  },
});
