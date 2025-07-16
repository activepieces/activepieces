import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoApiCall } from '../common/client';
import { shortIoAuth } from '../common/auth';

export const listShortLinksAction = createAction({
  auth: shortIoAuth,
  name: 'list-short-links',
  displayName: 'List Short Links',
  description: 'Retrieve a list of short links for a specific domain, with optional filters like pagination, date range, folder, and sorting.',
  props: {
    domain_id: Property.Number({
      displayName: 'Domain ID',
      description: 'The ID of the domain whose links you want to retrieve.',
      required: true,
    }),
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
    folderId: Property.ShortText({
      displayName: 'Folder ID',
      description: 'Filter links by folder.',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const query: Record<string, string> = {};

    for (const [key, value] of Object.entries(propsValue)) {
      if (value !== null && value !== undefined) {
        query[key] = String(value);
      }
    }

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
