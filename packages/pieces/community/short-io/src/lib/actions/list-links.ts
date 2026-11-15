import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoAuth } from '../common/auth';
import { shortIoLinkQueries } from '../common/link-queries';
import { shortIoLinks } from '../common/links';
import { shortIoSchemas } from '../common/output-schemas';
import { domainIdDropdown, folderIdDropdown } from '../common/props';
import { shortIoValues } from '../common/values';

export const listLinksAction = createAction({
  auth: shortIoAuth,
  name: 'list-short-links',
  classification: 'SEARCH',
  displayName: 'List Links',
  description: 'Retrieve one page of links on a domain, with pagination and date-range filters.',
  audience: 'human',
  aiMetadata: {
    description:
      'Lists one page of short links on a domain, with optional folder, link ID, creation-date and sort filters. Pass the returned nextPageToken as Page Token to get the next page. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: shortIoSchemas.legacyLinkList,
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
    const domain = shortIoLinks.parseDomainProp(propsValue.domain);
    const limit = shortIoValues.optionalNumber({ value: propsValue.limit, label: 'Limit', min: 1, max: 150 });
    const page = await shortIoLinkQueries.listPage({
      auth,
      domainId: domain.id,
      query: {
        limit,
        idString: propsValue.idString?.trim(),
        createdAt: propsValue.createdAt?.trim(),
        beforeDate: propsValue.beforeDate,
        afterDate: propsValue.afterDate,
        dateSortOrder: propsValue.dateSortOrder,
        pageToken: propsValue.pageToken?.trim(),
        folderId: propsValue.folderId,
      },
    });
    return {
      success: true,
      message: `Retrieved ${page.links.length} links on this page${page.nextPageToken ? ' (more pages available)' : ''}`,
      data: { count: page.count, links: page.links, nextPageToken: page.nextPageToken },
    };
  },
});
