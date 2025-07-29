import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { podioAuth } from '../../index';
import { podioApiCall, getAccessToken, dynamicAppProperty, dynamicItemProperty, limitProperty, offsetProperty } from '../common';

export const findItemAction = createAction({
  auth: podioAuth,
  name: 'find_item',
  displayName: 'Find Item',
  description: 'Retrieve a single item by ID or search for items in an app by field values',
  props: {
    searchType: Property.Dropdown({
      displayName: 'Search Type',
      description: 'How to search for the item',
      required: true,
      refreshers: [],
      options: async () => {
        return {
          options: [
            { label: 'Get by Item ID', value: 'by_id' },
            { label: 'Filter Items in App', value: 'filter' },
          ],
        };
      },
    }),
    itemId: Property.Number({
      displayName: 'Item ID',
      description: 'The ID of the item to retrieve (required when using "Get by Item ID")',
      required: false,
    }),
    selectedItem: dynamicItemProperty,
    markAsViewed: Property.Checkbox({
      displayName: 'Mark as Viewed',
      description: 'If true marks any new notifications on the given item as viewed, otherwise leaves any notifications untouched',
      required: false,
      defaultValue: true,
    }),
    appId: dynamicAppProperty,
    filters: Property.Object({
      displayName: 'Filters',
      description: 'Object containing filter criteria. Use field external_id as keys.',
      required: false,
    }),
    limit: limitProperty,
    offset: offsetProperty,
    sortBy: Property.ShortText({
      displayName: 'Sort By',
      description: 'Field to sort by (e.g., "created_on", "last_edit_on")',
      required: false,
    }),
    sortDesc: Property.Checkbox({
      displayName: 'Sort Descending',
      description: 'Whether to sort in descending order',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const accessToken = getAccessToken(context.auth);
    const { 
      searchType, 
      itemId, 
      selectedItem,
      markAsViewed,
      appId, 
      filters, 
      limit, 
      offset, 
      sortBy, 
      sortDesc 
    } = context.propsValue;

    if (searchType === 'by_id') {
      const finalItemId = selectedItem || itemId;
      
      if (!finalItemId) {
        throw new Error('Item ID is required when searching by ID. Please provide an item ID or select an item from the dropdown.');
      }

      const queryParams: any = {};
      if (typeof markAsViewed === 'boolean') {
        queryParams.mark_as_viewed = markAsViewed.toString();
      }

      const response = await podioApiCall({
        method: HttpMethod.GET,
        accessToken,
        resourceUri: `/item/${finalItemId}`,
        queryParams,
      });

      return response;
    } else if (searchType === 'filter') {
      if (!appId) {
        throw new Error('App selection is required when filtering items. Please select a Podio app from the dropdown.');
      }

      const body: any = {};
      
      if (filters && Object.keys(filters).length > 0) {
        body.filters = filters;
      }

      if (limit) {
        if (limit < 1 || limit > 500) {
          throw new Error('Limit must be between 1 and 500.');
        }
        body.limit = limit;
      }

      if (offset && offset < 0) {
        throw new Error('Offset must be 0 or greater.');
      }

      if (offset) {
        body.offset = offset;
      }

      if (sortBy) {
        body.sort_by = sortBy;
        body.sort_desc = Boolean(sortDesc);
      }

      const response = await podioApiCall({
        method: HttpMethod.POST,
        accessToken,
        resourceUri: `/item/app/${appId}/filter/`,
        body,
      });

      return response;
    } else {
      throw new Error('Invalid search type. Please select either "Get by Item ID" or "Filter Items in App".');
    }
  },
}); 