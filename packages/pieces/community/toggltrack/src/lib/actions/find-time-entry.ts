import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { toggleTrackAuth } from '../../index';
import { convertIdsToInt } from '../utils/convert-ids';

export const findTimeEntry = createAction({
  auth: toggleTrackAuth,
  name: 'findTimeEntry',
  displayName: 'Find Time Entry',
  description: 'Finds a time entry by description.',
  props: {
    workspaceId: Property.Dropdown({
      displayName: 'Workspace',
      description: 'Select the workspace',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [] };

        try {
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: 'https://api.track.toggl.com/api/v9/me/workspaces',
            headers: {
              Authorization: `Basic ${Buffer.from(`${auth}:api_token`).toString(
                'base64'
              )}`,
            },
          });

          if (response.status === 200) {
            return {
              options: response.body.map((workspace: any) => ({
                label: workspace.name,
                value: workspace.id,
              })),
            };
          }
        } catch (error) {
          return { options: [] };
        }

        return { options: [] };
      },
    }),

    description: Property.ShortText({
      displayName: 'Description',
      description: 'Description to search for in time entries',
      required: true,
    }),
  },
  async run(context) {
    const props = convertIdsToInt(context.propsValue);
    const { workspaceId, description } = props;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://api.track.toggl.com/api/v9/me/time_entries`,
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${context.auth}:api_token`
          ).toString('base64')}`,
        },
      });

      if (response.status === 200) {
        const timeEntries = response.body;

        // Filter by workspace and description
        const workspaceEntries = timeEntries.filter(
          (entry: any) => entry.workspace_id === workspaceId
        );

        const matchingEntries = workspaceEntries.filter(
          (entry: any) =>
            entry.description &&
            entry.description.toLowerCase().includes(description.toLowerCase())
        );

        return {
          success: true,
          time_entries: matchingEntries,
          count: matchingEntries.length,
        };
      } else {
        return {
          success: false,
          error: `API request failed with status ${response.status}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});
