import { Property } from '@activepieces/pieces-framework';
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
      
      let resourceUri = '/app/';
      if (spaceId) {
        resourceUri = `/app/space/${spaceId}/`;
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
          label: `${app.config?.name || app.name}${app.space ? ` (${app.space.name})` : ''}`,
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

    if (!orgId) {
      return {
        disabled: true,
        placeholder: 'Select an organization first',
        options: [],
      };
    }

    try {
      const accessToken = getAccessToken(auth as any);
      
      const resourceUri = `/org/${orgId}/space/`;

      const spaces = await podioApiCall<any[]>({
        method: HttpMethod.GET,
        accessToken,
        resourceUri,
      });

      if (!spaces || spaces.length === 0) {
        return {
          options: [],
          placeholder: 'No spaces found in this organization',
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
  refreshers: ['refType', 'appId', 'spaceId', 'orgId'],
  options: async ({ auth, refType, appId, spaceId, orgId }) => {
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

      switch (refType) {
        case 'item': {
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
        }

        case 'task': {
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
        }

        case 'status':
          if (!spaceId) {
            return {
              disabled: true,
              placeholder: 'Select a space first to load status updates',
              options: [],
            };
          }
          
          try {
            const statusResponse = await podioApiCall<any>({
              method: HttpMethod.GET,
              accessToken,
              resourceUri: `/stream/space/${spaceId}/`,
              queryParams: { 
                limit: 50,
                type: 'status'
              },
            });
            
            if (statusResponse?.items) {
              return {
                options: statusResponse.items
                  .filter((item: any) => item.type === 'status' && item.data)
                  .map((item: any) => ({
                    label: (item.data.value || item.data.text || '').substring(0, 60) + (item.data.value?.length > 60 ? '...' : '') || `Status ${item.data.status_id}`,
                    value: item.data.status_id,
                  }))
                  .slice(0, 30),
              };
            }
            
            return {
              options: [],
              placeholder: 'No status updates found in this space',
            };
          } catch (error) {
            return {
              options: [],
              placeholder: 'Enter status ID manually (could not load status updates)',
            };
          }

        case 'app':
          if (spaceId) {
            endpoint = `/app/space/${spaceId}/`;
          } else {
            endpoint = '/app/';
          }
          
          try {
            const appResponse = await podioApiCall<any[]>({
              method: HttpMethod.GET,
              accessToken,
              resourceUri: endpoint,
            });
            
            return {
              options: appResponse?.map((app: any) => ({
                label: `${app.config?.name || app.name}${app.space ? ` (${app.space.name})` : ''}`,
                value: app.app_id,
              })) || [],
            };
          } catch (error) {
            return {
              options: [],
              placeholder: spaceId ? 'No apps found in this space' : 'Failed to load apps',
            };
          }

        case 'space': {
          if (!orgId) {
            return {
              disabled: true,
              placeholder: 'Select an organization first to load spaces',
              options: [],
            };
          }
          
          const spaceResponse = await podioApiCall<any[]>({
            method: HttpMethod.GET,
            accessToken,
            resourceUri: `/org/${orgId}/space/`,
          });
          
          return {
            options: spaceResponse?.map((space: any) => ({
              label: space.name,
              value: space.space_id,
            })) || [],
          };
        }

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

export const dynamicFileProperty = Property.Dropdown({
  displayName: 'File',
  description: 'Select a file from the space',
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

    if (!spaceId) {
      return {
        disabled: true,
        placeholder: 'Select a space first to load files',
        options: [],
      };
    }

    try {
      const accessToken = getAccessToken(auth as any);
      const files = await podioApiCall<any[]>({
        method: HttpMethod.GET,
        accessToken,
        resourceUri: `/file/space/${spaceId}/`,
        queryParams: {
          limit: 50,
          sort_by: 'created_on',
          sort_desc: 'true'
        }
      });

      if (!files || files.length === 0) {
        return {
          options: [],
          placeholder: 'No files found in this space',
        };
      }

      return {
        options: files.map((file: any) => {
          let label = file.name || `File ${file.file_id}`;
          
          if (file.size) {
            const sizeInKB = Math.round(file.size / 1024);
            const sizeText = sizeInKB > 1024 
              ? `${Math.round(sizeInKB / 1024)}MB` 
              : `${sizeInKB}KB`;
            label += ` (${sizeText})`;
          }

          if (file.mimetype) {
            const fileType = file.mimetype.split('/')[0];
            const iconMap: Record<string, string> = {
              'image': '🖼️',
              'video': '🎥',
              'audio': '🎵',
              'text': '📄',
              'application': '📁'
            };
            const icon = iconMap[fileType] || '📄';
            label = `${icon} ${label}`;
          }

          if (file.context?.title) {
            label += ` → ${file.context.title}`;
          }

          return {
            label,
            value: file.file_id,
          };
        }),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load files. Check your connection.',
      };
    }
  },
});

export const dynamicTaskProperty = Property.Dropdown({
  displayName: 'Task',
  description: 'Select a Podio task',
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
      
      const userInfo = await podioApiCall<any>({
        method: HttpMethod.GET,
        accessToken,
        resourceUri: '/user/status',
      });

      const userId = userInfo?.user?.user_id;
      
      if (!userId) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Could not determine user ID for task filtering',
        };
      }

      const tasks = await podioApiCall<any[]>({
        method: HttpMethod.GET,
        accessToken,
        resourceUri: '/task/',
        queryParams: {
          responsible: userId,
          limit: 100,
          view: 'full',
          sort_by: 'created_on',
          sort_desc: 'true'
        }
      });

      if (!tasks || tasks.length === 0) {
        return {
          options: [],
          placeholder: 'No tasks found assigned to you',
        };
      }

      return {
        options: tasks.map((task: any) => {
          let label = task.text || `Task ${task.task_id}`;
          
          if (task.status === 'completed') {
            label = `✓ ${label}`;
          } else if (task.due_date) {
            const dueDate = new Date(task.due_date);
            const today = new Date();
            if (dueDate < today) {
              label = `⚠️ ${label} (Overdue)`;
            } else {
              label = `📅 ${label}`;
            }
          }

          if (task.ref?.title) {
            label += ` → ${task.ref.title}`;
          }

          return {
            label,
            value: task.task_id,
          };
        }),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load tasks. Check your connection.',
      };
    }
  },
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

export function formatFieldValues(appFields: any[], formData: Record<string, any>): Record<string, any> {
  
  const fields: Record<string, any> = {};

  for (const field of appFields) {
    const fieldKey = `field_${field.field_id}`;
    const fieldValue = formData[fieldKey];

    

    if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
      const fieldType = field.type;
      
      switch (fieldType) {
        case 'text':
          fields[field.field_id] = {
            value: fieldValue.toString(),
          };
          break;

        case 'number':
          fields[field.field_id] = {
            value: fieldValue.toString(),
          };
          break;

        case 'money':
          if (typeof fieldValue === 'object' && fieldValue.value) {
            fields[field.field_id] = {
              value: fieldValue.value.toString(),
              currency: fieldValue.currency || 'USD',
            };
          }
          break;

        case 'date':
          if (typeof fieldValue === 'object') {
            const dateObj: any = {};
            if (fieldValue.start_date) dateObj.start_date = fieldValue.start_date;
            if (fieldValue.start_time) dateObj.start_time = fieldValue.start_time;
            if (fieldValue.end_date) dateObj.end_date = fieldValue.end_date;
            if (fieldValue.end_time) dateObj.end_time = fieldValue.end_time;
            
            if (Object.keys(dateObj).length > 0) {
              fields[field.field_id] = dateObj;
            }
          }
          break;

        case 'contact':
        case 'member':
        case 'app':
        case 'category':
        case 'status':
        case 'image':
        case 'file':
        case 'duration':
        case 'video':
          fields[field.field_id] = {
            value: Number(fieldValue),
          };
          break;

        case 'progress': {
          const progressValue = Number(fieldValue);
          if (progressValue >= 0 && progressValue <= 100) {
            fields[field.field_id] = {
              value: progressValue,
            };
          }
          break;
        }

        case 'email':
        case 'phone':
          if (typeof fieldValue === 'object' && fieldValue.value) {
            fields[field.field_id] = {
              value: fieldValue.value,
              type: fieldValue.type || (fieldType === 'email' ? 'work' : 'mobile'),
            };
          }
          break;

        case 'location':
          fields[field.field_id] = {
            value: fieldValue.toString(),
          };
          break;

        case 'embed':
          if (typeof fieldValue === 'object' && fieldValue.embed) {
            fields[field.field_id] = {
              embed: fieldValue.embed,
              file: fieldValue.file || null,
            };
          }
          break;

        default:
          fields[field.field_id] = {
            value: fieldValue.toString(),
          };
      }
    }
  }

  
  return fields;
} 