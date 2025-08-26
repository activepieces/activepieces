import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { podioAuth } from '../../index';
import { podioApiCall, getAccessToken, silentProperty, hookProperty, dynamicAppProperty, dynamicSpaceProperty, dynamicOrgProperty } from '../common';

export const createCommentAction = createAction({
  auth: podioAuth,
  name: 'create_comment',
  displayName: 'Create Comment',
  description: 'Post a comment on an item or task.',
  props: {
    orgId: dynamicOrgProperty,
    spaceId: dynamicSpaceProperty,
    appId: dynamicAppProperty,

    type: Property.Dropdown({
      displayName: 'Comment On',
      description: 'What type of object to comment on',
      required: true,
      refreshers: [],
      options: async () => {
        return {
          options: [
            { label: 'Item', value: 'item' },
            { label: 'Task', value: 'task' },
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

              const taskQueryParams: any = {
                responsible: userId,
                limit: 30,
                view: 'full',
                sort_by: 'created_on',
                sort_desc: 'true'
              };

              if (spaceId) {
                taskQueryParams.space = spaceId;
              }
              
              const taskResponse = await podioApiCall<any[]>({
                method: HttpMethod.GET,
                accessToken,
                resourceUri: '/task/',
                queryParams: taskQueryParams,
              });
              
              return {
                options: taskResponse?.map((task: any) => {
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
          return {
            disabled: true,
            options: [],
            placeholder: `Failed to load ${type}s. Check your permissions.`,
          };
        }
      },
    }),

    value: Property.LongText({
      displayName: 'Comment Text',
      description: 'The content of your comment',
      required: true,
    }),
    externalId: Property.ShortText({
      displayName: 'External ID',
      description: 'Optional external identifier for the comment',
      required: false,
    }),

    fileIds: Property.Array({
      displayName: 'Attach Files',
      description: 'Select files from the space to attach to this comment (enter file IDs from the space)',
      required: false,
    }),
    embedId: Property.Number({
      displayName: 'Embed ID',
      description: 'ID of a previously created embedded link',
      required: false,
    }),
    embedUrl: Property.ShortText({
      displayName: 'Embed URL',
      description: 'URL to embed in the comment',
      required: false,
    }),

    alertInvite: Property.Checkbox({
      displayName: 'Auto-Invite Mentioned Users',
      description: 'Automatically invite mentioned users to the workspace if they lack access',
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
      throw new Error('Comment target type is required. Please select what type of object to comment on.');
    }

    if (!id) {
      throw new Error('Target object is required. Please select the specific object to comment on.');
    }

    if (!value || typeof value !== 'string' || value.trim().length === 0) {
      throw new Error('Comment text is required and cannot be empty.');
    }

    if (type === 'item' && !appId) {
      throw new Error('App selection is required when commenting on items. Please select an app first.');
    }

    if (fileIds && !Array.isArray(fileIds)) {
      throw new Error('File IDs must be provided as an array.');
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