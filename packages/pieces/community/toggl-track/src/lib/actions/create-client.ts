import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { togglTrackAuth } from '../..';
import { togglCommon } from '../common';

export const createClient = createAction({
  auth: togglTrackAuth,
  name: 'create_client',
  displayName: 'Create Client',
  description: 'Create a new client in a workspace.',
  audience: 'both',
  aiMetadata: { description: 'Creates a new client record in a Toggl Track workspace, given a workspace ID and client name (optional external reference and notes). Use when an agent needs to register a billable/organizational client before associating projects with it. Not idempotent: each call creates a new client even if the name already exists.', idempotent: false },
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
        'External reference to link this client with external systems.',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Notes for the client.',
      required: false,
    }),
  },
  async run(context) {
    const { workspace_id, name, external_reference, notes } =
      context.propsValue;
    const apiToken = context.auth;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.track.toggl.com/api/v9/workspaces/${workspace_id}/clients`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString(
          'base64'
        )}`,
      },
      body: {
        name,
        external_reference,
        notes,
      },
    });

    return response.body;
  },
});
