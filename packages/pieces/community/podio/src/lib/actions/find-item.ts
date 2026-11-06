import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { podioApi } from '../common/api';
import { podioClient } from '../common/client';
import { podioProps } from '../common/props';
import { podioAuth } from '../auth';
import type { PodioItemFilter } from '../common/types';
import { findItemOutputSchema } from '../output-schemas';

export const findItemAction = createAction({
  auth: podioAuth,
  name: 'find_item',
  outputSchema: findItemOutputSchema,
  classification: 'SEARCH',
  displayName: 'Find Item',
  description: 'Retrieve a single item by ID or field value.',
  audience: 'human',
  aiMetadata: { description: 'Looks up Podio items in one of two modes: fetch a single item directly by its item id, or filter items within an app by field criteria (with limit, offset, and sorting). Use to read a known record or search an app for matching records; the filter mode requires an app id. Idempotent — a read that does not modify data.', idempotent: true },
  props: {
    searchType: Property.Dropdown({
      auth: podioAuth,
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
    selectedItem: podioProps.itemId({ required: true }),
    markAsViewed: Property.Checkbox({
      displayName: 'Mark as Viewed',
      description: 'Mark any new notifications on this item as viewed',
      required: false,
      defaultValue: true,
    }),

    orgId: podioProps.orgId({ required: true }),
    spaceId: podioProps.spaceId({ required: true }),
    appId: podioProps.appId({ required: true }),

    filters: Property.Object({
      displayName: 'Search Filters',
      description: 'Filter criteria as JSON object. Use field external_id as keys.',
      required: false,
    }),

    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return (1-500, default: 20)',
      required: false,
      defaultValue: 20,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of results to skip for pagination (default: 0)',
      required: false,
      defaultValue: 0,
    }),
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

      const queryParams: QueryParams = {};
      if (typeof markAsViewed === 'boolean') {
        queryParams['mark_as_viewed'] = markAsViewed.toString();
      }

      return await podioClient.request<unknown>({
        method: HttpMethod.GET,
        auth: context.auth,
        path: `/item/${finalItemId}`,
        query: queryParams,
      });
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

      const body: PodioItemFilter = {};
      
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

      return await podioApi.filterItems({ auth: context.auth, appId, body });
    } else {
      throw new Error('Invalid search method. Please select either "Get by Item ID" or "Filter Items in App".');
    }
  },
});
