import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../../';
import {
  clampPage,
  clampPerPage,
  freshserviceApiCall,
  hasMorePages,
  REQUESTER_FILTER_MAX_PAGES,
  REQUESTER_FILTER_PAGE_SIZE,
} from '../../common/client';
import { freshserviceSchemas } from '../../common/schemas';

export const aiFindRequester = createAction({
  auth: freshserviceAuth,
  name: 'ai_find_requester',
  displayName: 'Find Requester (AI)',
  description: 'Finds Freshservice requesters by email or filter query.',
  audience: 'ai',
  classification: 'SEARCH',
  outputSchema: freshserviceSchemas.requesterList,
  aiMetadata: {
    description:
      'Looks up Freshservice requesters to get their numeric id. Pass an exact email, or a filter query such as "first_name:\'Jane\'" or "job_title:\'Engineer\'". With neither, lists requesters page by page. A filter query returns 30 per page, at most 40 pages. Returns an empty list when nothing matches. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({ displayName: 'Email', required: false }),
    query: Property.ShortText({ displayName: 'Filter Query', required: false }),
    page: Property.Number({ displayName: 'Page', required: false }),
    per_page: Property.Number({ displayName: 'Per Page', description: '1-100, default 30. Ignored with a filter query (fixed at 30).', required: false }),
  },
  async run(context) {
    const { email, query, page, per_page } = context.propsValue;
    const pageNumber = clampPage(page);
    const trimmedEmail = email?.trim();
    const trimmedQuery = query?.trim().replace(/^"+|"+$/g, '');
    const perPage = trimmedQuery ? REQUESTER_FILTER_PAGE_SIZE : clampPerPage(per_page);
    const response = await freshserviceApiCall<{ requesters: Record<string, unknown>[] }>({
      method: HttpMethod.GET,
      endpoint: 'requesters',
      auth: context.auth,
      queryParams: {
        page: String(pageNumber),
        ...(trimmedQuery ? {} : { per_page: String(perPage) }),
        ...(trimmedEmail ? { email: trimmedEmail } : {}),
        ...(trimmedQuery ? { query: `"${trimmedQuery}"` } : {}),
      },
    });
    const requesters = response.body.requesters ?? [];
    const hasMore =
      hasMorePages({ count: requesters.length, perPage }) &&
      (!trimmedQuery || pageNumber < REQUESTER_FILTER_MAX_PAGES);
    return { requesters, page: pageNumber, has_more: hasMore };
  },
});
