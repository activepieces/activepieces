import { createAction, Property } from '@activepieces/pieces-framework';
import { biginAuth } from '../../auth';
import { biginAiProps } from '../../common/props';
import { getBiginConnection } from '../../common/request';
import { biginRecords } from '../../common/records';
import { biginOutputSchemas } from '../../common/output-schemas';

export const biginListRecordsAi = createAction({
  auth: biginAuth,
  name: 'bigin_list_records',
  classification: 'READ',
  displayName: 'List Records (Agent)',
  description: 'List one page of records from a Bigin module.',
  audience: 'ai',
  outputSchema: biginOutputSchemas.aiRecordPage,
  aiMetadata: {
    description:
      'Lists one page (up to 200) of records from a Bigin module, optionally sorted. Returns more_records and, past 2000 records, a next_page_token to pass back as Page Token. Use to browse records or pick ids when you have no search term; use Search Records (Agent) to find records by name, email or phone. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    module: biginAiProps.module('The Bigin module to list records from.'),
    fields: Property.ShortText({
      displayName: 'Fields',
      description: 'Comma-separated field API names to return (max 50). Leave empty for a sensible default per module.',
      required: false,
    }),
    sortBy: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field to sort by.',
      required: false,
      options: {
        options: [
          { label: 'Created Time', value: 'Created_Time' },
          { label: 'Modified Time', value: 'Modified_Time' },
          { label: 'Record ID', value: 'id' },
        ],
      },
    }),
    sortOrder: Property.StaticDropdown({
      displayName: 'Sort Order',
      description: 'Sort direction.',
      required: false,
      options: {
        options: [
          { label: 'Descending', value: 'desc' },
          { label: 'Ascending', value: 'asc' },
        ],
      },
    }),
    page: Property.Number({ displayName: 'Page', description: 'Page number, starting at 1.', required: false }),
    perPage: Property.Number({ displayName: 'Per Page', description: 'Records per page, 1 to 200 (default 200).', required: false }),
    pageToken: Property.ShortText({
      displayName: 'Page Token',
      description: 'next_page_token from a previous call, needed to go past the first 2000 records. Overrides Page.',
      required: false,
    }),
  },
  async run(context) {
    const { module, fields, sortBy, sortOrder, page, perPage, pageToken } = context.propsValue;
    if (perPage !== undefined && perPage !== null && (perPage < 1 || perPage > 200)) {
      throw new Error('Per Page must be between 1 and 200.');
    }
    if (page !== undefined && page !== null && page < 1) {
      throw new Error('Page must be 1 or greater.');
    }
    return biginRecords.list({
      connection: getBiginConnection(context.auth),
      module,
      fields: fields ?? undefined,
      page: page ?? undefined,
      perPage: perPage ?? undefined,
      pageToken: pageToken ?? undefined,
      sortBy: sortBy ?? undefined,
      sortOrder: sortOrder ?? undefined,
    });
  },
});
