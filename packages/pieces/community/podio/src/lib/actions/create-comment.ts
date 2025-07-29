import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { podioAuth } from '../../index';
import { podioApiCall, getAccessToken, silentProperty, hookProperty, dynamicAppProperty, dynamicSpaceProperty } from '../common';

export const createCommentAction = createAction({
  auth: podioAuth,
  name: 'create_comment',
  displayName: 'Create Comment',
  description: 'Adds a new comment to the object of the given type and id',
  props: {
    appId: dynamicAppProperty,
    spaceId: dynamicSpaceProperty,
    type: Property.Dropdown({
      displayName: 'Object Type',
      description: 'The type of object to comment on',
      required: true,
      refreshers: [],
      options: async () => {
        return {
          options: [
            { label: 'Item', value: 'item' },
            { label: 'Task', value: 'task' },
            { label: 'Status', value: 'status' },
            { label: 'Space', value: 'space' },
            { label: 'App', value: 'app' },
          ],
        };
      },
    }),
    id: Property.Dropdown({
      displayName: 'Object',
      description: 'Select the specific object to comment on',
      required: true,
      refreshers: ['type', 'appId', 'spaceId'],
      options: async ({ auth, type, appId, spaceId }) => {
        if (!auth || !type) {
          return {
            disabled: true,
            placeholder: !auth ? 'Connect your Podio account first' : 'Select an object type first',
            options: [],
          };
        }

        try {
          const accessToken = getAccessToken(auth as any);

          switch (type) {
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
              let taskEndpoint = '/task/';
              if (spaceId) {
                taskEndpoint = `/task/space/${spaceId}/`;
              }
              
              const taskResponse = await podioApiCall<any[]>({
                method: HttpMethod.GET,
                accessToken,
                resourceUri: taskEndpoint,
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
              let appEndpoint = '/app/v2/';
              if (spaceId) {
                appEndpoint = `/app/space/${spaceId}/v2/`;
              }
              
              const appResponse = await podioApiCall<any[]>({
                method: HttpMethod.GET,
                accessToken,
                resourceUri: appEndpoint,
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
                placeholder: 'Unknown object type',
              };
          }
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: `Failed to load ${type}s. Check your permissions.`,
          };
        }
      },
    }),
    value: Property.LongText({
      displayName: 'Comment',
      description: 'The comment to be made',
      required: true,
    }),
    externalId: Property.ShortText({
      displayName: 'External ID',
      description: 'The external id of the comment, if any',
      required: false,
    }),
    fileIds: Property.Array({
      displayName: 'File IDs',
      description: 'Temporary files that have been uploaded and should be attached to this comment',
      required: false,
    }),
    embedId: Property.Number({
      displayName: 'Embed ID',
      description: 'The id of an embedded link that has been created',
      required: false,
    }),
    embedUrl: Property.ShortText({
      displayName: 'Embed URL',
      description: 'The url to be attached',
      required: false,
    }),
    alertInvite: Property.Checkbox({
      displayName: 'Alert Invite',
      description: 'True if any mentioned user should be automatically invited to the object if they do not have access',
      required: false,
      defaultValue: false,
    }),
    silent: silentProperty,
    hook: hookProperty,
  },
  async run(context) {
    const accessToken = getAccessToken(context.auth);
    const { 
      appId,
      spaceId,
      type, 
      id, 
      value, 
      externalId, 
      fileIds, 
      embedId, 
      embedUrl, 
      alertInvite, 
      silent, 
      hook 
    } = context.propsValue;

    if (!type) {
      throw new Error('Object Type is required. Please select the type of object to comment on.');
    }

    if (!id) {
      throw new Error('Object is required. Please select the specific object to comment on.');
    }

    if (!value || typeof value !== 'string' || value.trim().length === 0) {
      throw new Error('Comment text is required and cannot be empty.');
    }

    if (type === 'item' && !appId) {
      throw new Error('App selection is required when commenting on items. Please select an app first.');
    }

    if ((type === 'status' || type === 'task') && !spaceId) {
      throw new Error('Space selection is required when commenting on status updates or tasks. Please select a space first.');
    }

    if (fileIds && !Array.isArray(fileIds)) {
      throw new Error('File IDs must be provided as an array of numbers.');
    }

    if (embedId && typeof embedId !== 'number') {
      throw new Error('Embed ID must be a number.');
    }

    const body: any = {
      value: value.trim(),
    };

    if (externalId && externalId.trim()) {
      body.external_id = externalId.trim();
    }

    if (fileIds && Array.isArray(fileIds) && fileIds.length > 0) {
      body.file_ids = fileIds;
    }

    if (embedId) {
      body.embed_id = embedId;
    }

    if (embedUrl && embedUrl.trim()) {
      body.embed_url = embedUrl.trim();
    }

    if (typeof alertInvite === 'boolean') {
      body.alert_invite = alertInvite;
    }

    const queryParams: any = {};
    if (typeof silent === 'boolean') {
      queryParams.silent = silent.toString();
    }
    if (typeof hook === 'boolean') {
      queryParams.hook = hook.toString();
    }

    const response = await podioApiCall<{
      comment_id: number;
    }>({
      method: HttpMethod.POST,
      accessToken,
      resourceUri: `/comment/${type}/${id}`,
      body,
      queryParams,
    });

    return response;
  },
}); 