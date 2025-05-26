import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest, fetchWorkspaces } from '../common';
import { clockifyAuth } from '../../index';

export const findTimeEntryAction = createAction({
  auth: clockifyAuth,
  name: 'find_time_entry',
  displayName: 'Find Time Entry',
  description: 'Find a time entry by description',
  props: {
    workspaceId: Property.Dropdown({
      displayName: 'Workspace',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your Clockify account',
            options: [],
          };
        }

        const apiKey = auth as string;
        const workspaces = await fetchWorkspaces(apiKey);

        return {
          options: workspaces.map((workspace: any) => ({
            label: workspace.name,
            value: workspace.id,
          })),
        };
      },
    }),
    description: Property.ShortText({
      displayName: 'Description',
      required: true,
    }),
  },
  async run(context) {
    const apiKey = context.auth as string;
    const { workspaceId, description } = context.propsValue;

    const user = await makeRequest(apiKey, HttpMethod.GET, `/user`);
    const userId = user.id;

    const entries = await makeRequest(
      apiKey,
      HttpMethod.GET,
      `/workspaces/${workspaceId}/user/${userId}/time-entries?page-size=100`
    ) as Array<{
      id: string;
      description: string;
      timeInterval: {
        start: string;
        end?: string;
        duration?: string;
      };
      projectId?: string;
      taskId?: string;
      billable?: boolean;
      userId?: string;
    }>;

    return (
      entries.find(
        (entry) =>
          entry.description?.trim().toLowerCase() ===
          description.trim().toLowerCase()
      ) || null
    );
  },
});
