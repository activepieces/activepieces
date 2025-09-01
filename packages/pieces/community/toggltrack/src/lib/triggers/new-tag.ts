import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { toggleTrackAuth } from '../../index';
import { convertIdsToInt } from '../utils/convert-ids';

export const newTag = createTrigger({
  auth: toggleTrackAuth,
  name: 'newTag',
  displayName: 'New Tag',
  description: 'Triggers when a new tag is created.',
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
              'Authorization': `Basic ${Buffer.from(`${auth}:api_token`).toString('base64')}`,
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
  },
  type: TriggerStrategy.POLLING,
  
  async onEnable(context) {
    await context.store?.put('_last_check', new Date().toISOString());
  },

  async onDisable(context) {
    await context.store?.delete('_last_check');
  },

  async run(context) {
    const props = convertIdsToInt(context.propsValue);
    const { workspaceId } = props;
    
    try {
      const lastCheckRaw = await context.store?.get('_last_check');
      const lastCheckDate = typeof lastCheckRaw === 'string' ? new Date(lastCheckRaw) : new Date(0);
      
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://api.track.toggl.com/api/v9/workspaces/${workspaceId}/tags`,
        headers: {
          'Authorization': `Basic ${Buffer.from(`${context.auth}:api_token`).toString('base64')}`,
        },
      });

      if (response.status !== 200) return [];

      const tags = Array.isArray(response.body) ? response.body : [];
      const newTags = tags.filter((tag: any) => {
        if (!tag.created_at) return false;
        return new Date(tag.created_at) > lastCheckDate;
      });

      await context.store?.put('_last_check', new Date().toISOString());

      return newTags.map((tag: any) => ({
        id: tag.id,
        name: tag.name,
        workspace_id: tag.workspace_id,
        created_at: tag.created_at,
      }));

    } catch (error) {
      return [];
    }
  },

  sampleData: {
    id: 1985581,
    name: "urgent",
    workspace_id: 3134975,
    created_at: "2025-09-01T10:30:00+00:00",
    color: "#ff6b6b",
    deletable: true
  },
});
