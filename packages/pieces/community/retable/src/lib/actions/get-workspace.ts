import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { retableAuth } from '../..';
import { retableCommon } from '../common';

export const retableGetWorkspaceAction = createAction({
  auth: retableAuth,
  name: 'retable_get_workspace',
  classification: 'READ',
  displayName: 'Get Specific Workspace',
  description: 'Gets a single workspace by id, including its nested projects',
  audience: 'ai',
  aiMetadata: { description: 'Reads one Retable workspace by id, including its nested projects. Use when the workspace id is already known and a full listing isn\'t needed. Idempotent read.', idempotent: true },
  props: {
    workspace_id: Property.ShortText({
      displayName: 'Workspace ID',
      description: 'ID of the workspace, from Get Workspaces',
      required: true,
    }),
  },
  async run(context) {
    const { workspace_id } = context.propsValue;
    return (
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${retableCommon.baseUrl}/workspace/${workspace_id}`,
        headers: {
          ApiKey: context.auth.secret_text,
        },
      })
    ).body;
  },
});
