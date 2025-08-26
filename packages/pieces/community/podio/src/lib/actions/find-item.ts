import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { podioAuth } from '../../index';
import { podioApiCall, getAccessToken, dynamicAppProperty, dynamicItemProperty, limitProperty, offsetProperty, dynamicOrgProperty, dynamicSpaceProperty } from '../common';

export const findItemAction = createAction({
  auth: podioAuth,
  name: 'find_item',
  displayName: 'Find Item',
  description: 'Retrieve a single item by ID or field value.',
  props: {
    searchType: Property.Dropdown({
      displayName: 'Search Method',
      description: 'How to find the item',
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
      description: 'The specific item ID to retrieve',
      required: false,
    }),
    selectedItem: dynamicItemProperty,
    markAsViewed: Property.Checkbox({
      displayName: 'Mark as Viewed',
      description: 'Mark any new notifications on this item as viewed',
      required: false,
      defaultValue: true,
    }),

    orgId: dynamicOrgProperty,
    spaceId: dynamicSpaceProperty,
    appId: dynamicAppProperty,

    filters: Property.Object({
      displayName: 'Search Filters',
      description: 'Filter criteria as JSON object. Use field external_id as keys.',
      required: false,
    }),

    limit: limitProperty,
    offset: offsetProperty,
    sortBy: Property.ShortText({
      displayName: 'Sort By',
      description: 'Field to sort results by (e.g., "created_on", "last_edit_on")',
      required: false,
    }),
    sortDesc: Property.Checkbox({
      displayName: 'Sort Descending',
      description: 'Sort results in descending order',
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
      orgId,
      spaceId,
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
        throw new Error('Item ID is required. Please provide an item ID or select an item from the dropdown.');
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
        throw new Error('App selection is required for filtering. Please select an app first.');
      }

      if (limit && (limit < 1 || limit > 500)) {
        throw new Error('Limit must be between 1 and 500.');
      }

      if (offset && offset < 0) {
        throw new Error('Offset must be 0 or greater.');
      }

      const body: any = {};
      
      if (filters && typeof filters === 'object' && Object.keys(filters).length > 0) {
        body.filters = filters;
      }

      if (limit) {
        body.limit = limit;
      }

      if (offset) {
        body.offset = offset;
      }

      if (sortBy && sortBy.trim()) {
        body.sort_by = sortBy.trim();
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
      throw new Error('Invalid search method. Please select either "Get by Item ID" or "Filter Items in App".');
    }
  },
}); 