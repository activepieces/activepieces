import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaWorkspaceOutputSchema } from '../../output-schemas';

export const asanaGetWorkspaceAction = createAction({
  auth: asanaAuth,
  name: 'get_workspace',
  classification: 'READ',
  displayName: 'Get Workspace',
  description: 'Get an Asana workspace or organization.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one workspace: name, is_organization and its email domains. Check is_organization before using team actions, because teams exist only in organizations. Use List Workspaces to find workspace gids. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaWorkspaceOutputSchema,
  props: {
    workspace: Property.ShortText({
      displayName: 'Workspace GID',
      description: 'Gid of the workspace or organization. Obtain it from List Workspaces or Get Current User.',
      required: true,
    }),
  },
  async run(context) {
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/workspaces/${asanaUtils.pathSegment(context.propsValue.workspace)}`,
      operation: 'Get Workspace',
      query: { opt_fields: ASANA_FIELDS.workspace },
    });
  },
});
