import { createAction } from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../auth';
import { togglCommon } from '../common';
import { togglApi } from '../common/client';
import { togglModels, TwoClient } from '../common/models';
import { togglOutputSchemas } from '../output-schemas';

export const getClient = createAction({
  auth: togglTrackAuth,
  name: 'get_client',
  classification: 'READ',
  displayName: 'Get Client',
  description: 'Get a client by its ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns one client by ID. Notes and external reference are null on Toggl 2.0. Fails clearly when it does not exist. Read-only.',
    idempotent: true,
  },
  props: {
    workspace_id: togglCommon.workspace_id,
    client_id: togglCommon.required_client_id,
  },
  outputSchema: togglOutputSchemas.client,
  async run(context) {
    const auth = context.auth;
    const workspaceId = togglApi.requireId({
      value: context.propsValue.workspace_id,
      label: 'Workspace',
    });
    const clientId = togglApi.requireId({
      value: context.propsValue.client_id,
      label: 'Client',
    });
    return togglApi.withNotFound({
      label: `Client ${clientId}`,
      run: async () => {
        if (togglApi.isTwo(auth)) {
          const client = await togglApi.request<TwoClient>({
            auth,
            method: togglApi.HttpMethod.GET,
            path: `/workspaces/${workspaceId}/clients/${clientId}`,
          });
          return togglModels.client(client);
        }
        return togglApi.request<Record<string, unknown>>({
          auth,
          method: togglApi.HttpMethod.GET,
          path: `/workspaces/${workspaceId}/clients/${clientId}`,
        });
      },
    });
  },
});
