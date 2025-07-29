import { Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { podioApiCall } from './client';
import { getAccessToken } from './auth';

export const appIdProperty = Property.Number({
  displayName: 'App ID',
  description: 'The ID of the Podio app',
  required: true,
});

export const dynamicAppProperty = Property.Dropdown({
  displayName: 'App',
  description: 'Select a Podio app',
  required: true,
  refreshers: ['spaceId'],
  options: async ({ auth, spaceId }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your Podio account first',
        options: [],
      };
    }

    try {
      const accessToken = getAccessToken(auth as any);
      
      let resourceUri = '/app/v2/';
      if (spaceId) {
        resourceUri = `/app/space/${spaceId}/v2/`;
      }

      const apps = await podioApiCall<any[]>({
        method: HttpMethod.GET,
        accessToken,
        resourceUri,
      });

      if (!apps || apps.length === 0) {
        return {
          options: [],
          placeholder: spaceId ? 'No apps found in this space' : 'No apps found',
        };
      }

      return {
        options: apps.map((app: any) => ({
          label: `${app.name}${app.space ? ` (${app.space.name})` : ''}`,
          value: app.app_id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load apps. Check your connection.',
      };
    }
  },
});

export const dynamicSpaceProperty = Property.Dropdown({
  displayName: 'Space',
  description: 'Select a Podio workspace',
  required: true,
  refreshers: ['orgId'],
  options: async ({ auth, orgId }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your Podio account first',
        options: [],
      };
    }

    try {
      const accessToken = getAccessToken(auth as any);
      
      let resourceUri = '/space/';
      if (orgId) {
        resourceUri = `/space/org/${orgId}/`;
      }

      const spaces = await podioApiCall<any[]>({
        method: HttpMethod.GET,
        accessToken,
        resourceUri,
      });

      if (!spaces || spaces.length === 0) {
        return {
          options: [],
          placeholder: 'No spaces found',
        };
      }

      return {
        options: spaces.map((space: any) => ({
          label: `${space.name}${space.org ? ` (${space.org.name})` : ''}`,
          value: space.space_id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load spaces. Check your connection.',
      };
    }
  },
});

export const dynamicOrgProperty = Property.Dropdown({
  displayName: 'Organization',
  description: 'Select a Podio organization',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your Podio account first',
        options: [],
      };
    }

    try {
      const accessToken = getAccessToken(auth as any);
      
      const orgs = await podioApiCall<any[]>({
        method: HttpMethod.GET,
        accessToken,
        resourceUri: '/org/',
      });

      if (!orgs || orgs.length === 0) {
        return {
          options: [],
          placeholder: 'No organizations found',
        };
      }

      return {
        options: orgs.map((org: any) => ({
          label: org.name,
          value: org.org_id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load organizations. Check your connection.',
      };
    }
  },
});

export const dynamicItemProperty = Property.Dropdown({
  displayName: 'Item',
  description: 'Select a Podio item',
  required: true,
  refreshers: ['appId'],
  options: async ({ auth, appId }) => {
    if (!auth || !appId) {
      return {
        disabled: true,
        placeholder: !auth ? 'Connect your Podio account first' : 'Select an app first',
        options: [],
      };
    }

    try {
      const accessToken = getAccessToken(auth as any);
      
      const response = await podioApiCall<{ items: any[] }>({
        method: HttpMethod.POST,
        accessToken,
        resourceUri: `/item/app/${appId}/filter/`,
        body: { limit: 50 },
      });

      if (!response.items || response.items.length === 0) {
        return {
          options: [],
          placeholder: 'No items found in this app',
        };
      }

      return {
        options: response.items.map((item: any) => ({
          label: `${item.title || `Item ${item.item_id}`}`,
          value: item.item_id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load items. Check your permissions.',
      };
    }
  },
});

export const dynamicRefTypeProperty = Property.Dropdown({
  displayName: 'Reference Type',
  description: 'The type of object to reference',
  required: false,
  refreshers: [],
  options: async () => {
    return {
      options: [
        { label: 'Item', value: 'item' },
        { label: 'Task', value: 'task' },
        { label: 'Status', value: 'status' },
        { label: 'App', value: 'app' },
        { label: 'Space', value: 'space' },
      ],
    };
  },
});

export const dynamicRefIdProperty = Property.Dropdown({
  displayName: 'Reference Object',
  description: 'Select the specific object to reference',
  required: false,
  refreshers: ['refType', 'appId', 'spaceId'],
  options: async ({ auth, refType, appId, spaceId }) => {
    if (!auth || !refType) {
      return {
        disabled: true,
        placeholder: !auth ? 'Connect your Podio account first' : 'Select a reference type first',
        options: [],
      };
    }

    try {
      const accessToken = getAccessToken(auth as any);
      let endpoint = '';
      let responseKey = '';

      switch (refType) {
        case 'item':
          if (!appId) {
            return {
              disabled: true,
              placeholder: 'Select an app first to load items',
              options: [],
            };
          }
          const itemResponse = await podioApiCall<{ items: any[] }>({
            method: HttpMethod.POST,
            accessToken,
            resourceUri: `/item/app/${appId}/filter/`,
            body: { limit: 30 },
          });
          return {
            options: itemResponse.items?.map((item: any) => ({
              label: item.title || `Item ${item.item_id}`,
              value: item.item_id,
            })) || [],
          };

        case 'task':
          if (spaceId) {
            endpoint = `/task/space/${spaceId}/`;
          } else {
            endpoint = '/task/';
          }
          
          const taskResponse = await podioApiCall<any[]>({
            method: HttpMethod.GET,
            accessToken,
            resourceUri: endpoint,
            queryParams: { limit: 30 },
          });
          
          return {
            options: taskResponse?.map((task: any) => ({
              label: task.text || `Task ${task.task_id}`,
              value: task.task_id,
            })) || [],
          };

        case 'status':
          if (!spaceId) {
            return {
              disabled: true,
              placeholder: 'Select a space first to load status updates',
              options: [],
            };
          }
          
          const statusResponse = await podioApiCall<any[]>({
            method: HttpMethod.GET,
            accessToken,
            resourceUri: `/status/space/${spaceId}/`,
            queryParams: { limit: 30 },
          });
          
          return {
            options: statusResponse?.map((status: any) => ({
              label: status.value?.substring(0, 50) + '...' || `Status ${status.status_id}`,
              value: status.status_id,
            })) || [],
          };

        case 'app':
          if (spaceId) {
            endpoint = `/app/space/${spaceId}/v2/`;
          } else {
            endpoint = '/app/v2/';
          }
          
          const appResponse = await podioApiCall<any[]>({
            method: HttpMethod.GET,
            accessToken,
            resourceUri: endpoint,
          });
          
          return {
            options: appResponse?.map((app: any) => ({
              label: app.name,
              value: app.app_id,
            })) || [],
          };

        case 'space':
          const spaceResponse = await podioApiCall<any[]>({
            method: HttpMethod.GET,
            accessToken,
            resourceUri: '/space/',
          });
          
          return {
            options: spaceResponse?.map((space: any) => ({
              label: space.name,
              value: space.space_id,
            })) || [],
          };

        default:
          return {
            options: [],
            placeholder: 'Unknown reference type',
          };
      }
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: `Failed to load ${refType}s. Check your permissions.`,
      };
    }
  },
});

export const spaceIdProperty = Property.Number({
  displayName: 'Space ID',
  description: 'The ID of the Podio workspace/space',
  required: true,
});

export const itemIdProperty = Property.Number({
  displayName: 'Item ID',
  description: 'The ID of the Podio item',
  required: true,
});

export const taskIdProperty = Property.Number({
  displayName: 'Task ID',
  description: 'The ID of the Podio task',
  required: true,
});

export const orgIdProperty = Property.Number({
  displayName: 'Organization ID',
  description: 'The ID of the Podio organization',
  required: true,
});

export const refTypeProperty = Property.Dropdown({
  displayName: 'Reference Type',
  description: 'The type of object',
  required: true,
  refreshers: [],
  options: async () => {
    return {
      options: [
        { label: 'Item', value: 'item' },
        { label: 'Task', value: 'task' },
        { label: 'Status', value: 'status' },
        { label: 'App', value: 'app' },
        { label: 'Space', value: 'space' },
      ],
    };
  },
});

export const statusProperty = Property.Dropdown({
  displayName: 'Status',
  description: 'The status filter',
  required: false,
  refreshers: [],
  options: async () => {
    return {
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Completed', value: 'completed' },
        { label: 'All', value: 'all' },
      ],
    };
  },
});

export const silentProperty = Property.Checkbox({
  displayName: 'Silent Mode',
  description: 'If true, notifications will not be triggered and the object will not appear in activity streams',
  required: false,
  defaultValue: false,
});

export const hookProperty = Property.Checkbox({
  displayName: 'Execute Hooks',
  description: 'If false, webhooks and integrations will not be triggered for this operation',
  required: false,
  defaultValue: true,
});

export const limitProperty = Property.Number({
  displayName: 'Limit',
  description: 'Maximum number of results to return (1-500, default: 20)',
  required: false,
  defaultValue: 20,
});

export const offsetProperty = Property.Number({
  displayName: 'Offset',
  description: 'Number of results to skip for pagination (default: 0)',
  required: false,
  defaultValue: 0,
}); 