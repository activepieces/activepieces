import { DropdownState, InputPropertyMap, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { podioAuth } from '../auth';
import { podioApi } from './api';
import { podioClient } from './client';
import type { PodioApp, PodioAppField, PodioFile, PodioOrg, PodioSpace, PodioStatusData, PodioStream, PodioStreamObject, PodioTask } from './types';

function orgId<R extends boolean>({ required, displayName = 'Organization', description = 'Select a Podio organization' }: PropParams<R>) {
  return Property.Dropdown({
    auth: podioAuth,
    displayName,
    description,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return disabledOptions({ placeholder: 'Connect your Podio account first' });
      }

      try {
        const orgs = await podioClient.request<PodioOrg[]>({
          auth,
          method: HttpMethod.GET,
          path: '/org/',
        });

        if (!orgs || orgs.length === 0) {
          return {
            options: [],
            placeholder: 'No organizations found',
          };
        }

        return {
          options: orgs.map((org) => ({
            label: org.name,
            value: org.org_id,
          })),
        };
      } catch (error) {
        return disabledOptions({ placeholder: 'Failed to load organizations. Check your connection.' });
      }
    },
  });
}

function spaceId<R extends boolean>({ required, displayName = 'Space', description = 'Select a Podio workspace' }: PropParams<R>) {
  return Property.Dropdown({
    auth: podioAuth,
    displayName,
    description,
    required,
    refreshers: ['orgId'],
    options: async ({ auth, orgId }) => {
      if (!auth) {
        return disabledOptions({ placeholder: 'Connect your Podio account first' });
      }

      if (!orgId) {
        return disabledOptions({ placeholder: 'Select an organization first' });
      }

      try {
        const spaces = await podioClient.request<PodioSpace[]>({
          auth,
          method: HttpMethod.GET,
          path: `/org/${orgId}/space/`,
        });

        if (!spaces || spaces.length === 0) {
          return {
            options: [],
            placeholder: 'No spaces found in this organization',
          };
        }

        return {
          options: spaces.map((space) => ({
            label: `${space.name}${space.org ? ` (${space.org.name})` : ''}`,
            value: space.space_id,
          })),
        };
      } catch (error) {
        return disabledOptions({ placeholder: 'Failed to load spaces. Check your connection.' });
      }
    },
  });
}

function appId<R extends boolean>({ required, displayName = 'App', description = 'Select a Podio app' }: PropParams<R>) {
  return Property.Dropdown({
    auth: podioAuth,
    displayName,
    description,
    required,
    refreshers: ['spaceId'],
    options: async ({ auth, spaceId }) => {
      if (!auth) {
        return disabledOptions({ placeholder: 'Connect your Podio account first' });
      }

      try {
        let path = '/app/';
        if (spaceId) {
          path = `/app/space/${spaceId}/`;
        }

        const apps = await podioClient.request<PodioApp[]>({
          auth,
          method: HttpMethod.GET,
          path,
        });

        if (!apps || apps.length === 0) {
          return {
            options: [],
            placeholder: spaceId ? 'No apps found in this space' : 'No apps found',
          };
        }

        return {
          options: apps.map((app) => ({
            label: appLabel({ app }),
            value: app.app_id,
          })),
        };
      } catch (error) {
        return disabledOptions({ placeholder: 'Failed to load apps. Check your connection.' });
      }
    },
  });
}

function itemId<R extends boolean>({ required, displayName = 'Item', description = 'Select a Podio item' }: PropParams<R>) {
  return Property.Dropdown({
    auth: podioAuth,
    displayName,
    description,
    required,
    refreshers: ['appId'],
    options: async ({ auth, appId }) => {
      if (!auth || !appId) {
        return disabledOptions({ placeholder: !auth ? 'Connect your Podio account first' : 'Select an app first' });
      }

      try {
        const response = await podioApi.filterItems({ auth, appId, body: { limit: 50 } });

        if (!response.items || response.items.length === 0) {
          return {
            options: [],
            placeholder: 'No items found in this app',
          };
        }

        return {
          options: response.items.map((item) => ({
            label: `${item.title || `Item ${item.item_id}`}`,
            value: item.item_id,
          })),
        };
      } catch (error) {
        return disabledOptions({ placeholder: 'Failed to load items. Check your permissions.' });
      }
    },
  });
}

function refType<R extends boolean>({ required, displayName = 'Reference Type', description = 'The type of object to reference' }: PropParams<R>) {
  return Property.Dropdown({
    auth: podioAuth,
    displayName,
    description,
    required,
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
}

function refId<R extends boolean>({ required, displayName = 'Reference Object', description = 'Select the specific object to reference' }: PropParams<R>) {
  return Property.Dropdown({
    auth: podioAuth,
    displayName,
    description,
    required,
    refreshers: ['refType', 'appId', 'spaceId', 'orgId'],
    options: async ({ auth, refType, appId, spaceId, orgId }) => {
      if (!auth || !refType) {
        return disabledOptions({ placeholder: !auth ? 'Connect your Podio account first' : 'Select a reference type first' });
      }

      try {
        let endpoint = '';

        switch (refType) {
          case 'item': {
            if (!appId) {
              return disabledOptions({ placeholder: 'Select an app first to load items' });
            }
            const itemResponse = await podioApi.filterItems({ auth, appId, body: { limit: 30 } });
            return {
              options: itemResponse.items?.map((item) => ({
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

            const taskResponse = await podioClient.request<PodioTask[]>({
              auth,
              method: HttpMethod.GET,
              path: endpoint,
              query: { limit: '30' },
            });

            return {
              options: taskResponse?.map((task) => ({
                label: task.text || `Task ${task.task_id}`,
                value: task.task_id,
              })) || [],
            };
          }

          case 'status':
            if (!spaceId) {
              return disabledOptions({ placeholder: 'Select a space first to load status updates' });
            }

            try {
              const statusResponse = await podioClient.request<PodioStream>({
                auth,
                method: HttpMethod.GET,
                path: `/stream/space/${spaceId}/`,
                query: {
                  limit: '50',
                  type: 'status'
                },
              });

              if (statusResponse?.items) {
                return {
                  options: statusResponse.items
                    .filter((item): item is PodioStreamObject & { data: PodioStatusData } => item.type === 'status' && !!item.data)
                    .map((item) => ({
                      label: (item.data.value || item.data.text || '').substring(0, 60) + ((item.data.value?.length ?? 0) > 60 ? '...' : '') || `Status ${item.data.status_id}`,
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
              const appResponse = await podioClient.request<PodioApp[]>({
                auth,
                method: HttpMethod.GET,
                path: endpoint,
              });

              return {
                options: appResponse?.map((app) => ({
                  label: appLabel({ app }),
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
              return disabledOptions({ placeholder: 'Select an organization first to load spaces' });
            }

            const spaceResponse = await podioClient.request<PodioSpace[]>({
              auth,
              method: HttpMethod.GET,
              path: `/org/${orgId}/space/`,
            });

            return {
              options: spaceResponse?.map((space) => ({
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
        return disabledOptions({ placeholder: `Failed to load ${refType}s. Check your permissions.` });
      }
    },
  });
}

function fileId<R extends boolean>({ required, displayName = 'File', description = 'Select a file from the space' }: PropParams<R>) {
  return Property.Dropdown({
    auth: podioAuth,
    displayName,
    description,
    required,
    refreshers: ['spaceId'],
    options: async ({ auth, spaceId }) => {
      if (!auth) {
        return disabledOptions({ placeholder: 'Connect your Podio account first' });
      }

      if (!spaceId) {
        return disabledOptions({ placeholder: 'Select a space first to load files' });
      }

      try {
        const files = await podioClient.request<PodioFile[]>({
          auth,
          method: HttpMethod.GET,
          path: `/file/space/${spaceId}/`,
          query: {
            limit: '50',
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
          options: files.map((file) => {
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
              const icon = FILE_TYPE_ICONS[fileType] || '📄';
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
        return disabledOptions({ placeholder: 'Failed to load files. Check your connection.' });
      }
    },
  });
}

function taskId<R extends boolean>({ required, displayName = 'Task', description = 'Select a Podio task' }: PropParams<R>) {
  return Property.Dropdown({
    auth: podioAuth,
    displayName,
    description,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return disabledOptions({ placeholder: 'Connect your Podio account first' });
      }

      try {
        const userInfo = await podioApi.getUserStatus({ auth });

        const userId = userInfo?.user?.user_id;

        if (!userId) {
          return disabledOptions({ placeholder: 'Could not determine user ID for task filtering' });
        }

        const tasks = await podioClient.request<PodioTask[]>({
          auth,
          method: HttpMethod.GET,
          path: '/task/',
          query: {
            responsible: String(userId),
            limit: '100',
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
          options: tasks.map((task) => {
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
        return disabledOptions({ placeholder: 'Failed to load tasks. Check your connection.' });
      }
    },
  });
}

function commentObjectId<R extends boolean>({ required, displayName = 'Object', description = 'Select the specific object to comment on' }: PropParams<R>) {
  return Property.Dropdown({
    auth: podioAuth,
    displayName,
    description,
    required,
    refreshers: ['type', 'appId', 'spaceId'],
    options: async ({ auth, type, appId, spaceId }) => {
      if (!auth || !type) {
        return disabledOptions({ placeholder: !auth ? 'Connect your Podio account first' : 'Select an object type first' });
      }

      try {
        switch (type) {
          case 'item': {
            if (!appId) {
              return disabledOptions({ placeholder: 'Select an app first to load items' });
            }
            const itemResponse = await podioApi.filterItems({ auth, appId, body: { limit: 30 } });
            return {
              options: itemResponse.items?.map((item) => ({
                label: item.title || `Item ${item.item_id}`,
                value: item.item_id,
              })) || [],
            };
          }

          case 'task': {
            const userInfo = await podioApi.getUserStatus({ auth });
            const userId = userInfo?.user?.user_id;

            if (!userId) {
              return disabledOptions({ placeholder: 'Could not determine user ID for task filtering' });
            }

            const taskQueryParams: Record<string, string> = {
              responsible: String(userId),
              limit: '30',
              view: 'full',
              sort_by: 'created_on',
              sort_desc: 'true'
            };

            if (spaceId) {
              taskQueryParams['space'] = String(spaceId);
            }

            const taskResponse = await podioClient.request<PodioTask[]>({
              auth,
              method: HttpMethod.GET,
              path: '/task/',
              query: taskQueryParams,
            });

            return {
              options: taskResponse?.map((task) => {
                let label = task.text || `Task ${task.task_id}`;
                if (task.ref?.title) {
                  label += ` → ${task.ref.title}`;
                }
                return {
                  label,
                  value: task.task_id,
                };
              }) || [],
            };
          }

          default:
            return {
              options: [],
              placeholder: 'Please select Item or Task',
            };
        }
      } catch (error) {
        return disabledOptions({ placeholder: `Failed to load ${type}s. Check your permissions.` });
      }
    },
  });
}

function itemFields<R extends boolean>({ required, displayName = 'App Fields', description = 'Configure values for the fields in the selected app' }: PropParams<R>) {
  return Property.DynamicProperties({
    auth: podioAuth,
    displayName,
    description,
    required,
    refreshers: ['appId'],
    props: async ({ auth, appId }) => {
      if (!auth || !appId) {
        return {};
      }

      try {
        const app = await podioApi.getApp({ auth, appId });
        const fields = app.fields || [];

        if (!fields || fields.length === 0) {
          return {};
        }

        return buildFieldProps({ fields, forUpdate: false });
      } catch (error) {
        return {};
      }
    },
  });
}

function itemUpdateFields<R extends boolean>({ required, displayName = 'App Fields', description = 'Configure values for the fields you want to update in the selected app' }: PropParams<R>) {
  return Property.DynamicProperties({
    auth: podioAuth,
    displayName,
    description,
    required,
    refreshers: ['appId'],
    props: async ({ auth, appId }) => {
      if (!auth || !appId) {
        return {};
      }

      try {
        const app = await podioApi.getApp({ auth, appId });
        const fields = app.fields || [];

        if (!fields || fields.length === 0) {
          return {};
        }

        return buildFieldProps({ fields, forUpdate: true });
      } catch (error) {
        return {};
      }
    },
  });
}

function silent<R extends boolean>({ required, displayName = 'Silent Mode', description = 'If true, notifications will not be triggered and the object will not appear in activity streams' }: PropParams<R>) {
  return Property.Checkbox({
    displayName,
    description,
    required,
    defaultValue: false,
  });
}

function hook<R extends boolean>({ required, displayName = 'Execute Hooks', description = 'If false, webhooks and integrations will not be triggered for this operation' }: PropParams<R>) {
  return Property.Checkbox({
    displayName,
    description,
    required,
    defaultValue: true,
  });
}

function buildFieldProps({ fields, forUpdate }: { fields: PodioAppField[]; forUpdate: boolean }): InputPropertyMap {
  const fieldProperties: InputPropertyMap = {};

  for (const field of fields) {
    try {
      const fieldKey = `field_${field.field_id}`;
      const fieldConfig = field.config;
      const fieldType = field.type;
      const isRequired = forUpdate ? false : fieldConfig.required || false;

      const baseProps = {
        displayName: fieldConfig.label,
        description: fieldConfig.description || `${forUpdate ? 'Update' : 'Enter'} value for ${fieldConfig.label}`,
        required: isRequired,
      };

      switch (fieldType) {
        case 'text':
          fieldProperties[fieldKey] = Property.LongText({
            ...baseProps,
            description: `${baseProps.description}. Supports plain text, markdown, or HTML.`,
          });
          break;

        case 'number':
          fieldProperties[fieldKey] = Property.Number({
            ...baseProps,
            description: `${baseProps.description}. Enter a numeric value.`,
          });
          break;

        case 'money':
          fieldProperties[fieldKey] = Property.Object({
            ...baseProps,
            description: `${baseProps.description}. Format: {"value": "amount", "currency": "USD"}`,
          });
          break;

        case 'date':
          fieldProperties[fieldKey] = Property.Object({
            ...baseProps,
            description: `${baseProps.description}. Format: {"start_date": "YYYY-MM-DD", "start_time": "HH:MM:SS", "end_date": "YYYY-MM-DD", "end_time": "HH:MM:SS"}`,
          });
          break;

        case 'contact':
          fieldProperties[fieldKey] = Property.Number({
            ...baseProps,
            description: `${baseProps.description}. Enter the Podio profile ID of the contact.`,
          });
          break;

        case 'member':
          fieldProperties[fieldKey] = Property.Number({
            ...baseProps,
            description: `${baseProps.description}. Enter the Podio user ID of the member.`,
          });
          break;

        case 'app':
          fieldProperties[fieldKey] = Property.Number({
            ...baseProps,
            description: `${baseProps.description}. Enter the ID of the item from the linked app.`,
          });
          break;

        case 'category':
        case 'status': {
          let staticOptions: Array<{ label: string; value: string | number | undefined }> = [];

          if (fieldConfig.settings?.options && Array.isArray(fieldConfig.settings.options)) {
            staticOptions = fieldConfig.settings.options.map((option) => ({
              label: option.text || option.name || option.value || `Option ${option.id}`,
              value: option.id || option.value,
            }));
          }

          if (staticOptions.length > 0) {
            fieldProperties[fieldKey] = Property.StaticDropdown({
              ...baseProps,
              options: {
                options: staticOptions,
              },
            });
          } else {
            fieldProperties[fieldKey] = Property.Number({
              ...baseProps,
              description: `${baseProps.description}. Enter the ${fieldType} option ID manually.`,
            });
          }
          break;
        }

        case 'email':
          fieldProperties[fieldKey] = Property.Object({
            ...baseProps,
            description: `${baseProps.description}. Format: {"value": "email@example.com", "type": "work|home|other"}`,
          });
          break;

        case 'phone':
          fieldProperties[fieldKey] = Property.Object({
            ...baseProps,
            description: `${baseProps.description}. Format: {"value": "phone_number", "type": "mobile|work|home|main|work_fax|private_fax|other"}`,
          });
          break;

        case 'location':
          fieldProperties[fieldKey] = Property.ShortText({
            ...baseProps,
            description: `${baseProps.description}. Enter a location (address, coordinates, etc.)`,
          });
          break;

        case 'image':
        case 'file':
          fieldProperties[fieldKey] = Property.Number({
            ...baseProps,
            description: `${baseProps.description}. Enter the file ID of the uploaded ${fieldType}.`,
          });
          break;

        case 'progress':
          fieldProperties[fieldKey] = Property.Number({
            ...baseProps,
            description: `${baseProps.description}. Enter a value between 0 and 100.`,
          });
          break;

        default:
          fieldProperties[fieldKey] = Property.ShortText({
            ...baseProps,
            description: `${baseProps.description}. Field type: ${fieldType}`,
          });
      }
    } catch (fieldError) {
      const fieldKey = `field_${field.field_id}`;
      fieldProperties[fieldKey] = Property.ShortText({
        displayName: `${field.config?.label || 'Unknown Field'} (Fallback)`,
        description: `Field type "${field.type}" - Manual entry required. Original error: ${fieldError instanceof Error ? fieldError.message : 'Unknown error'}`,
        required: forUpdate ? false : field.config?.required || false,
      });
    }
  }

  return fieldProperties;
}

function appLabel({ app }: { app: PodioApp }): string {
  return `${app.config?.name || app.name}${app.space ? ` (${app.space.name})` : ''}`;
}

function disabledOptions({ placeholder }: { placeholder: string }): DropdownState<never> {
  return { disabled: true, options: [], placeholder };
}

export const podioProps = {
  orgId,
  spaceId,
  appId,
  itemId,
  refType,
  refId,
  fileId,
  taskId,
  commentObjectId,
  itemFields,
  itemUpdateFields,
  silent,
  hook,
};

const FILE_TYPE_ICONS: Record<string, string> = {
  'image': '🖼️',
  'video': '🎥',
  'audio': '🎵',
  'text': '📄',
  'application': '📁'
};

export type PropParams<R extends boolean> = { required: R; displayName?: string; description?: string };
