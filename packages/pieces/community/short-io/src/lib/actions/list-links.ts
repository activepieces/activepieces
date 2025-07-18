import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoApiCall } from '../common/client';
import { shortIoAuth } from '../common/auth';
import { domainIdDropdown, folderIdDropdown } from '../common/props';

export const listLinksAction = createAction({
  auth: shortIoAuth,
  name: 'list-short-links',
  displayName: 'List Links',
  description:
    'Retrieve all links on a domain, with pagination and date-range filters.',
  props: {
    domain: {
      ...domainIdDropdown,
      required: true,
      description: 'Select the domain to retrieve links from',
    },
    folderId: folderIdDropdown,
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of results to return (1-150). Default is 50.',
      required: false,
    }),
    idString: Property.ShortText({
      displayName: 'Link ID Filter',
      description: 'Filter by specific link ID (optional).',
      required: false,
    }),
    createdAt: Property.ShortText({
      displayName: 'Exact Creation Time',
      description: 'Filter by exact creation time (ISO format or timestamp).',
      required: false,
    }),
    beforeDate: Property.DateTime({
      displayName: 'Before Date',
      description: 'Return links created before this date and time.',
      required: false,
    }),
    afterDate: Property.DateTime({
      displayName: 'After Date',
      description: 'Return links created after this date and time.',
      required: false,
    }),
    dateSortOrder: Property.StaticDropdown({
      displayName: 'Date Sort Order',
      description: 'Order links by creation date.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Ascending (Oldest First)', value: 'asc' },
          { label: 'Descending (Newest First)', value: 'desc' },
        ],
      },
    }),
    pageToken: Property.ShortText({
      displayName: 'Page Token',
      description: 'Token for paginated results (get this from previous response).',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const {
      domain: domainString,
      limit,
      idString,
      createdAt,
      beforeDate,
      afterDate,
      dateSortOrder,
      pageToken,
      folderId,
    } = propsValue;

    if (!domainString) {
      throw new Error('Domain is required. Please select a domain.');
    }

    if (limit && (limit < 1 || limit > 150)) {
      throw new Error('Limit must be between 1 and 150.');
    }

    const query: Record<string, string> = {};

    const domainObject = JSON.parse(domainString as string);
    query['domain_id'] = String(domainObject.id);

    if (limit) query['limit'] = String(limit);
    if (idString && idString.trim() !== '') query['idString'] = String(idString);
    if (createdAt && createdAt.trim() !== '') query['createdAt'] = String(createdAt);
    if (beforeDate) query['beforeDate'] = beforeDate;
    if (afterDate) query['afterDate'] = afterDate;
    if (dateSortOrder) query['dateSortOrder'] = String(dateSortOrder);
    if (pageToken && pageToken.trim() !== '') query['pageToken'] = String(pageToken);
    if (folderId) query['folderId'] = String(folderId);

    try {
      const response = await shortIoApiCall({
        method: HttpMethod.GET,
        auth,
        resourceUri: '/api/links',
        query,
      });

      const linkCount = (response as any)['count'] || ((response as any)['links'] ? (response as any)['links'].length : 0);
      const hasNextPage = (response as any)['nextPageToken'] ? ' (more pages available)' : '';

      return {
        success: true,
        message: `Retrieved ${linkCount} links successfully${hasNextPage}`,
        data: response,
      };
    } catch (error: any) {
      if (error.message.includes('400')) {
        throw new Error(
          'Invalid request parameters. Please check your filter values and try again.'
        );
      }
      
      if (error.message.includes('401') || error.message.includes('403')) {
        throw new Error(
          'Authentication failed or insufficient permissions. Please check your API key and domain access.'
        );
      }
      
      if (error.message.includes('404')) {
        throw new Error(
          'Domain not found. Please verify the domain exists and you have access to it.'
        );
      }
      
      if (error.message.includes('429')) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment before trying again.'
        );
      }

      throw new Error(`Failed to retrieve links: ${error.message}`);
    }
  },
});
