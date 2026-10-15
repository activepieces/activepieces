import { createAction, Property } from '@activepieces/pieces-framework';
import { QueryParams } from '@activepieces/pieces-common';
import { togglTrackAuth } from '../auth';
import { togglCommon } from '../common';
import { togglApi } from '../common/client';
import { togglModels, TwoClient } from '../common/models';
import { togglOutputSchemas } from '../output-schemas';

export const findClient = createAction({
  auth: togglTrackAuth,
  name: 'find_client',
  classification: 'SEARCH',
  displayName: 'Find Client',
  description: 'Find a client by name or status in a workspace.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists clients in a workspace, optionally filtered by name and active/archived status. Returns an array of clients. Read-only.',
    idempotent: true,
  },
  props: {
    workspace_id: togglCommon.workspace_id,
    name: Property.ShortText({
      displayName: 'Client Name',
      description: 'The name of the client to find (case-insensitive).',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Filter clients by their status.',
      required: false,
      options: {
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Archived', value: 'archived' },
          { label: 'Both', value: 'both' },
        ],
      },
    }),
  },
  outputSchema: togglOutputSchemas.clientList,
  async run(context) {
    const { name, status } = context.propsValue;
    const auth = context.auth;
    const workspaceId = togglApi.requireId({
      value: context.propsValue.workspace_id,
      label: 'Workspace',
    });

    if (togglApi.isTwo(auth)) {
      const clients = await togglApi.listTwoPages<TwoClient>({
        auth,
        path: `/workspaces/${workspaceId}/clients`,
        queryParams: name ? { name } : {},
      });
      const search = name?.trim().toLowerCase();
      return clients
        .filter((client) =>
          search ? client.name.toLowerCase().includes(search) : true
        )
        .filter((client) => {
          if (status === 'active') return client.active;
          if (status === 'archived') return !client.active;
          return true;
        })
        .map(togglModels.client);
    }

    const queryParams: QueryParams = {};
    if (name) {
      queryParams['name'] = name;
    }
    if (status) {
      queryParams['status'] = status;
    }
    const clients = await togglApi.request<Record<string, unknown>[] | null>({
      auth,
      method: togglApi.HttpMethod.GET,
      path: `/workspaces/${workspaceId}/clients`,
      queryParams,
    });
    return clients ?? [];
  },
});
