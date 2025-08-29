import { createAction, Property } from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../..';
import { togglTrackApi } from '../common';

export const createProject = createAction({
  auth: togglTrackAuth,
  name: 'create_project',
  displayName: 'Create Project',
  description: 'Create a new project.',
  props: {
    workspaceId: Property.Dropdown({
      displayName: 'Workspace',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }
        const workspaces = await togglTrackApi.getWorkspaces(auth as string);
        return {
          disabled: false,
          options: workspaces.map((workspace) => {
            return {
              label: workspace.name,
              value: workspace.id.toString(),
            };
          }),
        };
      },
    }),
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    is_private: Property.Checkbox({
      displayName: 'Private',
      required: false,
    }),
    billable: Property.Checkbox({
      displayName: 'Billable',
      required: false,
    }),
    clientId: Property.Dropdown({
      displayName: 'Client',
      required: false,
      refreshers: ['workspaceId'],
      options: async ({ auth, workspaceId }) => {
        if (!auth || !workspaceId) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please select a workspace first',
          };
        }
        const clients = await togglTrackApi.getClients(
          auth as string,
          parseInt(workspaceId as string)
        );
        return {
          disabled: false,
          options: clients.map((client) => {
            return {
              label: client.name,
              value: client.id.toString(),
            };
          }),
        };
      },
    }),
  },
  async run(context) {
    const { workspaceId, name, is_private, billable, clientId } = context.propsValue;
    const project = {
      name: name as string,
      is_private: is_private as boolean,
      billable: billable as boolean,
      client_id: clientId ? parseInt(clientId as string) : undefined,
    };
    return await togglTrackApi.createProject(
      context.auth as string,
      parseInt(workspaceId as string),
      project
    );
  },
});
