import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { podioAuth } from '../../index';
import { podioApiCall, getAccessToken, statusProperty, limitProperty, offsetProperty, dynamicAppProperty, dynamicSpaceProperty, dynamicOrgProperty } from '../common';

export const findTaskAction = createAction({
  auth: podioAuth,
  name: 'find_task',
  displayName: 'Find Task',
  description: 'Retrieve a task by ID or search for tasks',
  props: {
    searchType: Property.Dropdown({
      displayName: 'Search Type',
      description: 'How to search for the task',
      required: true,
      refreshers: [],
      options: async () => {
        return {
          options: [
            { label: 'Get by Task ID', value: 'by_id' },
            { label: 'Get My Tasks', value: 'my_tasks' },
            { label: 'Get Tasks for Reference', value: 'by_reference' },
          ],
        };
      },
    }),
    taskId: Property.Number({
      displayName: 'Task ID',
      description: 'The ID of the task to retrieve (required when using "Get by Task ID")',
      required: false,
    }),
    orgId: dynamicOrgProperty,
    spaceId: dynamicSpaceProperty,
    appId: dynamicAppProperty,
    refType: Property.Dropdown({
      displayName: 'Reference Type',
      description: 'Type of object to get tasks for (required when using "Get Tasks for Reference")',
      required: false,
      refreshers: [],
      options: async () => {
        return {
          options: [
            { label: 'Item', value: 'item' },
            { label: 'App', value: 'app' },
            { label: 'Space', value: 'space' },
          ],
        };
      },
    }),
    refId: Property.Dropdown({
      displayName: 'Reference Object',
      description: 'Select the specific object to get tasks for (required when using "Get Tasks for Reference")',
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
    }),
    status: statusProperty,
    limit: limitProperty,
    offset: offsetProperty,
  },
  async run(context) {
    const accessToken = getAccessToken(context.auth);
    const { 
      searchType, 
      taskId, 
      appId,
      spaceId,
      refType, 
      refId, 
      status, 
      limit, 
      offset 
    } = context.propsValue;

    if (!searchType) {
      throw new Error('Search Type is required. Please select how you want to search for tasks.');
    }

    if (searchType === 'by_id' && !taskId) {
      throw new Error('Task ID is required when using "Get by Task ID" search type.');
    }

    if (searchType === 'by_reference') {
      if (!refType) {
        throw new Error('Reference Type is required when using "Get Tasks for Reference" search type.');
      }
      if (!refId) {
        throw new Error('Reference Object is required when using "Get Tasks for Reference" search type. Please select an object from the dropdown.');
      }
      if (refType === 'item' && !appId) {
        throw new Error('App selection is required when getting tasks for items. Please select an app first.');
      }
    }

    if (limit && (typeof limit !== 'number' || limit < 1 || limit > 500)) {
      throw new Error('Limit must be a number between 1 and 500.');
    }

    if (offset && (typeof offset !== 'number' || offset < 0)) {
      throw new Error('Offset must be a number greater than or equal to 0.');
    }

    let resourceUri = '';
    const queryParams: any = {};

    switch (searchType) {
      case 'by_id':
        resourceUri = `/task/${taskId}`;
        break;

      case 'my_tasks':
        resourceUri = '/task/';
        if (status && status !== 'all') {
          queryParams.completed = status === 'completed' ? 'true' : 'false';
        }
        if (limit) queryParams.limit = limit.toString();
        if (offset) queryParams.offset = offset.toString();
        break;

      case 'by_reference':
        resourceUri = `/task/${refType}/${refId}/`;
        if (status && status !== 'all') {
          queryParams.completed = status === 'completed' ? 'true' : 'false';
        }
        if (limit) queryParams.limit = limit.toString();
        if (offset) queryParams.offset = offset.toString();
        break;

      default:
        throw new Error(`Invalid search type: ${searchType}. Please select a valid search option.`);
    }

    const response = await podioApiCall<any>({
      method: HttpMethod.GET,
      accessToken,
      resourceUri,
      queryParams,
    });

    return response;
  },
}); 