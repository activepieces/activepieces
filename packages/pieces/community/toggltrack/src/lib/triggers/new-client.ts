import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { toggleTrackAuth } from '../../index';
import { convertIdsToInt } from '../utils/convert-ids';

export const newClient = createTrigger({
  auth: toggleTrackAuth,
  name: 'newClient',
  displayName: 'New Client',
  description: 'Fires when a new client is created in a workspace.',
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
    try {
      const currentTime = new Date().toISOString();
      await context.store?.put('_last_check', currentTime);
      
      // Validate the workspace exists
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://api.track.toggl.com/api/v9/workspaces/${context.propsValue.workspaceId}/clients?per_page=1`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${context.auth}:api_token`).toString('base64')}`,
        },
      });
      
    } catch (error) {
      throw new Error(`Failed to initialize New Client trigger: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async onDisable(context) {
    try {
      await context.store?.delete('_last_check');
    } catch (error) {
      console.error('Error during trigger cleanup:', error);
    }
  },

  async run(context) {
    const props = convertIdsToInt(context.propsValue);
    const { workspaceId } = props;
    
    try {
      const lastCheckRaw = await context.store?.get('_last_check');
      
      let lastCheckDate: Date;
      
      if (typeof lastCheckRaw === 'string' && lastCheckRaw.trim() !== '') {
        try {
          lastCheckDate = new Date(lastCheckRaw);
          if (isNaN(lastCheckDate.getTime())) {
            lastCheckDate = new Date(0);
          }
        } catch (error) {
          lastCheckDate = new Date(0);
        }
      } else {
        lastCheckDate = new Date(0);
      }
      
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://api.track.toggl.com/api/v9/workspaces/${workspaceId}/clients`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${context.auth}:api_token`).toString('base64')}`,
        },
      });

      if (response.status !== 200) {
        throw new Error(`Failed to fetch clients: ${response.status}`);
      }

      const clients = Array.isArray(response.body) ? response.body : [];
      
      const newClients = clients.filter((client: any) => {
        if (!client.at) return false;
        const clientCreatedAt = new Date(client.at);
        return clientCreatedAt > lastCheckDate;
      });

      const currentTime = new Date().toISOString();
      await context.store?.put('_last_check', currentTime);

      return newClients.map((client: any) => ({
        id: client.id,
        name: client.name,
        workspace_id: client.wid,
        created_at: client.at,
        notes: client.notes || '',
        external_reference: client.external_reference || '',
      }));

    } catch (error) {
      console.error('Error in New Client trigger:', error);
      return [];
    }
  },

  sampleData: {
    id: 123456789,
    name: "Acme Corporation",
    workspace_id: 3134975,
    created_at: "2025-09-01T10:30:00+00:00",
    notes: "Important client from the tech sector",
    external_reference: "CRM-ACC-001",
    archived: false,
    creator_id: 9876543,
    permissions: ["read", "write", "admin"]
  },
});
