import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoAiProps } from '../../common/ai-props';
import { shortIoAuth } from '../../common/auth';
import { shortIoLinkQueries } from '../../common/link-queries';
import { shortIoLinks } from '../../common/links';
import { shortIoSchemas } from '../../common/output-schemas';
import { shortIoValues } from '../../common/values';

export const listLinksAiAction = createAction({
  auth: shortIoAuth,
  name: 'list_links',
  displayName: 'List Links (AI)',
  description: 'List one page of links on a domain, newest first by default.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page (up to 150) of short links on a domain, optionally in one folder or created before/after a date. Returns items, nextPageToken and hasMore; pass nextPageToken back as Page Token for the next page. Read-only.',
    idempotent: true,
  },
  outputSchema: shortIoSchemas.linkList,
  props: {
    domain: shortIoAiProps.domain(),
    folderId: shortIoAiProps.folderId(),
    createdAfter: Property.ShortText({ displayName: 'Created After', description: 'ISO 8601 date-time; only links created after it.', required: false }),
    createdBefore: Property.ShortText({ displayName: 'Created Before', description: 'ISO 8601 date-time; only links created before it.', required: false }),
    sortOrder: Property.StaticDropdown({
      displayName: 'Sort Order',
      required: false,
      defaultValue: 'desc',
      options: { disabled: false, options: [{ label: 'Newest first', value: 'desc' }, { label: 'Oldest first', value: 'asc' }] },
    }),
    limit: Property.Number({ displayName: 'Limit', description: 'Links per page (1-150). Default 50.', required: false }),
    pageToken: Property.ShortText({ displayName: 'Page Token', description: 'nextPageToken from a previous call.', required: false }),
  },
  async run({ auth, propsValue }) {
    const limit = shortIoValues.optionalNumber({ value: propsValue.limit, label: 'Limit', min: 1, max: 150 }) ?? 50;
    const afterDate = propsValue.createdAfter?.trim() ? shortIoValues.toIsoDateTime({ value: propsValue.createdAfter, label: 'Created After' }) : undefined;
    const beforeDate = propsValue.createdBefore?.trim() ? shortIoValues.toIsoDateTime({ value: propsValue.createdBefore, label: 'Created Before' }) : undefined;
    const domain = await shortIoLinks.resolveDomain({ auth, input: propsValue.domain });
    const page = await shortIoLinkQueries.listPage({
      auth,
      domainId: domain.id,
      query: {
        limit,
        folderId: propsValue.folderId?.trim(),
        afterDate,
        beforeDate,
        dateSortOrder: propsValue.sortOrder === 'asc' ? 'asc' : 'desc',
        pageToken: propsValue.pageToken?.trim(),
      },
    });
    return { items: page.links, count: page.links.length, nextPageToken: page.nextPageToken, hasMore: page.nextPageToken !== null };
  },
});
