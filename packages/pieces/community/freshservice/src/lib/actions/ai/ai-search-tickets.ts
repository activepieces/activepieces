import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../../';
import { clampPage, clampPerPage, freshserviceApiCall, hasMorePages } from '../../common/client';
import { freshserviceSchemas } from '../../common/schemas';

export const aiSearchTickets = createAction({
  auth: freshserviceAuth,
  name: 'ai_search_tickets',
  displayName: 'Search Tickets (AI)',
  description: 'Lists or filters Freshservice tickets.',
  audience: 'ai',
  classification: 'SEARCH',
  outputSchema: freshserviceSchemas.ticketList,
  aiMetadata: {
    description:
      'Finds Freshservice tickets. With a query, uses the ticket filter syntax, e.g. "status:2 AND priority:4", "agent_id:123", "requester_id:456", "created_at:>\'2026-01-01\'" (30 per page, at most 10 pages). Without a query, lists tickets newest first; by default Freshservice only returns tickets created in the last 30 days, so pass updated_since (ISO date) to reach older tickets. Use page to continue while has_more is true. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Filter Query',
      description: 'Freshservice filter query, e.g. status:2 AND priority:3. Leave empty to list tickets.',
      required: false,
    }),
    updated_since: Property.ShortText({
      displayName: 'Updated Since',
      description: 'ISO 8601 date-time. Only used without a query.',
      required: false,
    }),
    page: Property.Number({ displayName: 'Page', description: 'Page number, starting at 1.', required: false }),
    per_page: Property.Number({
      displayName: 'Per Page',
      description: '1-100, default 30. Ignored with a query (fixed at 30).',
      required: false,
    }),
  },
  async run(context) {
    const { query, updated_since, page, per_page } = context.propsValue;
    const pageNumber = clampPage(page);
    const trimmedQuery = query?.trim().replace(/^"+|"+$/g, '');
    if (trimmedQuery) {
      const response = await freshserviceApiCall<{ tickets: Record<string, unknown>[]; total?: number }>({
        method: HttpMethod.GET,
        endpoint: 'tickets/filter',
        auth: context.auth,
        queryParams: { query: `"${trimmedQuery}"`, page: String(pageNumber) },
      });
      const tickets = response.body.tickets ?? [];
      const total = response.body.total ?? null;
      const hasMore =
        pageNumber < FILTER_MAX_PAGES &&
        (total === null ? hasMorePages({ count: tickets.length, perPage: FILTER_PAGE_SIZE }) : pageNumber * FILTER_PAGE_SIZE < total);
      return { tickets, total, page: pageNumber, has_more: hasMore };
    }
    const perPage = clampPerPage(per_page);
    const sinceValue = updated_since?.trim();
    const response = await freshserviceApiCall<{ tickets: Record<string, unknown>[] }>({
      method: HttpMethod.GET,
      endpoint: 'tickets',
      auth: context.auth,
      queryParams: {
        page: String(pageNumber),
        per_page: String(perPage),
        order_type: 'desc',
        ...(sinceValue ? { updated_since: sinceValue } : {}),
      },
    });
    const tickets = response.body.tickets ?? [];
    return {
      tickets,
      total: null,
      page: pageNumber,
      has_more: hasMorePages({ count: tickets.length, perPage }),
    };
  },
});

const FILTER_PAGE_SIZE = 30;
const FILTER_MAX_PAGES = 10;
