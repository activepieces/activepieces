import { createAction, Property } from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../auth';
import { togglCommon } from '../common';
import { togglApi } from '../common/client';
import { togglModels, TwoClient } from '../common/models';
import { togglOutputSchemas } from '../output-schemas';

export const createClient = createAction({
  auth: togglTrackAuth,
  name: 'create_client',
  classification: 'WRITE',
  displayName: 'Create Client',
  description: 'Create a new client in a workspace.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a client in a workspace. Needs the workspace and a name; notes and external reference are saved on Classic only. Returns the new client. A retry creates a duplicate.',
    idempotent: false,
  },
  props: {
    workspace_id: togglCommon.workspace_id,
    name: Property.ShortText({
      displayName: 'Client Name',
      description: 'The name of the new client.',
      required: true,
    }),
    external_reference: Property.ShortText({
      displayName: 'External Reference',
      description:
        'External system reference. Toggl Track (Classic) only.',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Notes for the client. Toggl Track (Classic) only.',
      required: false,
    }),
  },
  outputSchema: togglOutputSchemas.client,
  async run(context) {
    const { name, external_reference, notes } = context.propsValue;
    const auth = context.auth;
    const workspaceId = togglApi.requireId({
      value: context.propsValue.workspace_id,
      label: 'Workspace',
    });

    if (togglApi.isTwo(auth)) {
      const created = await togglApi.request<TwoClient>({
        auth,
        method: togglApi.HttpMethod.POST,
        path: `/workspaces/${workspaceId}/clients`,
        body: { name },
      });
      return togglModels.client(created);
    }

    return togglApi.request<Record<string, unknown>>({
      auth,
      method: togglApi.HttpMethod.POST,
      path: `/workspaces/${workspaceId}/clients`,
      body: {
        name,
        external_reference,
        notes,
      },
    });
  },
});
