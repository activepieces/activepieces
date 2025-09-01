import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { toggleTrackAuth } from '../../index';
import { convertIdsToInt } from '../utils/convert-ids';

export const createTag = createAction({
  auth: toggleTrackAuth,
  name: 'createTag',
  displayName: 'Create Tag',
  description: 'Create a new tag in the workspace.',
  props: {
    workspaceId: Property.Dropdown({
      displayName: 'Workspace',
      description: 'Select the workspace where the tag will be created',
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
    name: Property.ShortText({
      displayName: 'Tag Name',
      description: 'Name of the tag to create',
      required: true,
    }),
  },
  async run(context) {
  const props = convertIdsToInt(context.propsValue);
  const { workspaceId, projectId, name } = props;
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `https://api.track.toggl.com/api/v9/workspaces/${workspaceId}/tags`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(
            `${context.auth}:api_token`
          ).toString('base64')}`,
        },
        body: {
          name: name.trim(),
          workspace_id: parseInt(workspaceId, 10),
        },
      });
      if (response.status === 200 || response.status === 201) {
        const tag = response.body;
        return {
          id: tag.id,
          name: tag.name,
          workspace_id: tag.workspace_id,
          created_at: tag.created_at,
        };
      } else {
        return {
          success: false,
          error: `Failed to create tag: ${response.status}`,
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
