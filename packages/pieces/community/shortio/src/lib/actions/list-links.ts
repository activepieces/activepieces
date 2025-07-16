import { createAction, Property } from '@activepieces/pieces-framework';
import { shortioAuth, shortioCommon, shortioApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const listLinks = createAction({
  auth: shortioAuth,
  name: 'list_links',
  displayName: 'List Links',
  description: 'Retrieve all links on a domain with pagination and date-range filters',
  props: {
    domain_id: shortioCommon.domain_id,
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of links to retrieve (1 to 150)',
      required: false,
      defaultValue: 100,
    }),
    idString: Property.ShortText({
      displayName: 'Link ID String',
      description: 'Filter by specific link ID string',
      required: false,
    }),
    createdAt: Property.DateTime({
      displayName: 'Created At',
      description: 'Filter by creation date (ISO string)',
      required: false,
    }),
    beforeDate: Property.DateTime({
      displayName: 'Before Date',
      description: 'Filter links created before this date',
      required: false,
    }),
    afterDate: Property.DateTime({
      displayName: 'After Date',
      description: 'Filter links created after this date',
      required: false,
    }),
    dateSortOrder: Property.StaticDropdown({
      displayName: 'Date Sort Order',
      description: 'Sort order for date filtering',
      required: false,
      options: {
        options: [
          { label: 'Ascending', value: 'asc' },
          { label: 'Descending', value: 'desc' },
        ],
      },
    }),
    pageToken: Property.ShortText({
      displayName: 'Page Token',
      description: 'Token for pagination to get next page of results',
      required: false,
    }),
    folderId: Property.ShortText({
      displayName: 'Folder ID',
      description: 'Filter links by folder ID',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const props = propsValue as any;
    
    const queryParams: Record<string, any> = {
      domain_id: props.domain_id,
    };

    const optionalParams = {
      limit: props.limit,
      idString: props.idString,
      createdAt: props.createdAt,
      beforeDate: props.beforeDate ? new Date(props.beforeDate).toISOString() : undefined,
      afterDate: props.afterDate ? new Date(props.afterDate).toISOString() : undefined, 
      dateSortOrder: props.dateSortOrder,
      pageToken: props.pageToken,
      folderId: props.folderId
    };

    Object.entries(optionalParams).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams[key] = value;
      }
    });

    const response = await shortioApiCall({
      apiKey: auth,
      method: HttpMethod.GET,
      resourceUri: '/api/links',
      query: queryParams,
    });

    return response;
  },
});
