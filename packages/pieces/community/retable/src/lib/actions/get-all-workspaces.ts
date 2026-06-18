import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { retableAuth } from '../..';
import { retableCommon } from '../common';

export const retableGetAllWorkspacesAction = createAction({
  auth: retableAuth,
  name: 'retable_get_workspaces',
  displayName: 'Get Workspaces',
  description: 'Gets all workspaces',
  audience: 'both',
  aiMetadata: { description: 'Lists all Retable workspaces accessible with the connected API key. Use as the entry point to discover workspace IDs needed by project, retable, and record actions. Takes no input; read-only and idempotent.', idempotent: true },
  props: {},
  async run(context) {
    return (
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${retableCommon.baseUrl}/workspace`,
        headers: {
          ApiKey: context.auth.secret_text,
        },
      })
    ).body;
  },
});
