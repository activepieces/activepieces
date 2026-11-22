import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bokioAuth } from '../common/auth';
import { bokioClient } from '../common/client';
import { bokioBuilders } from '../common/builders';
import { bokioSchemas } from '../common/schemas';
import { bokioProps } from '../common/props';

export const listJournalEntries = createAction({
  auth: bokioAuth,
  name: 'list_journal_entries',
  classification: 'SEARCH',
  displayName: 'List Journal Entries',
  description: 'Lists journal entries, optionally within a date range.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists journal entries (verifications) in a Bokio company one page at a time, optionally within a date range (YYYY-MM-DD, inclusive). Returns items with their debit/credit lines plus totalItems, totalPages and currentPage; pageSize is 1 to 100 (default 25). Read-only.',
    idempotent: true,
  },
  outputSchema: bokioSchemas.journalEntryPage,
  props: {
    dateFrom: Property.ShortText({
      displayName: 'Date From',
      description: 'YYYY-MM-DD, inclusive',
      required: false,
    }),
    dateTo: Property.ShortText({
      displayName: 'Date To',
      description: 'YYYY-MM-DD, inclusive',
      required: false,
    }),
    ...bokioProps.pageProps(),
  },
  async run(context) {
    const p = context.propsValue;
    const query = bokioClient.buildFilter([
      {
        field: 'date',
        operator: '>=',
        value: bokioBuilders.optionalDate({ value: p.dateFrom, field: 'Date from' }),
      },
      {
        field: 'date',
        operator: '<=',
        value: bokioBuilders.optionalDate({ value: p.dateTo, field: 'Date to' }),
      },
    ]);
    const body = await bokioClient.request<unknown>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: '/journal-entries',
      operation: 'list journal entries',
      queryParams: bokioClient.listParams({ page: p.page, pageSize: p.pageSize, query }),
    });
    return bokioClient.normalizePage<unknown>(body);
  },
});
