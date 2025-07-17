import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoApiCall } from '../common/client';
import { shortIoAuth } from '../common/auth';
import { domainIdDropdown, folderIdDropdown } from '../common/props';

export const listLinksAction = createAction({
  auth: shortIoAuth,
  name: 'list-short-links',
  displayName: 'List Short Links',
  description:
    'Retrieve a list of short links for a specific domain, with optional filters like pagination, date range, folder, and sorting.',
  props: {
    domain: domainIdDropdown,
    folderId: folderIdDropdown,
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of results to return (max: 150).',
      required: false,
    }),
    idString: Property.ShortText({
      displayName: 'ID String',
      description: 'Optional link ID filter.',
      required: false,
    }),
    createdAt: Property.ShortText({
      displayName: 'Created At',
      description: 'Exact creation time (ISO format or timestamp).',
      required: false,
    }),
    beforeDate: Property.ShortText({
      displayName: 'Before Date',
      description: 'Return links created before this date (ISO format).',
      required: false,
    }),
    afterDate: Property.ShortText({
      displayName: 'After Date',
      description: 'Return links created after this date (ISO format).',
      required: false,
    }),
    dateSortOrder: Property.StaticDropdown({
      displayName: 'Date Sort Order',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Ascending', value: 'asc' },
          { label: 'Descending', value: 'desc' },
        ],
      },
    }),
    pageToken: Property.ShortText({
      displayName: 'Page Token',
      description: 'Token for paginated results.',
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

    const query: Record<string, string> = {};

    if (domainString) {
      const domainObject = JSON.parse(domainString as string);
      query['domain_id'] = String(domainObject.id);
    }
    if (limit) query['limit'] = String(limit);
    if (idString) query['idString'] = String(idString);
    if (createdAt) query['createdAt'] = String(createdAt);
    if (beforeDate) query['beforeDate'] = String(beforeDate);
    if (afterDate) query['afterDate'] = String(afterDate);
    if (dateSortOrder) query['dateSortOrder'] = String(dateSortOrder);
    if (pageToken) query['pageToken'] = String(pageToken);
    if (folderId) query['folderId'] = String(folderId);

    try {
      const response = await shortIoApiCall({
        method: HttpMethod.GET,
        auth,
        resourceUri: '/api/links',
        query,
      });

      return {
        success: true,
        message: 'Links retrieved successfully.',
        data: response,
      };
    } catch (error: any) {
      throw new Error(`Failed to retrieve links: ${error.message}`);
    }
  },
});
