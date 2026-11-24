import { MarkdownVariant, Property, createAction } from '@activepieces/pieces-framework';
import { TeableCommon } from '../common';
import { teableClient } from '../common/client';
import { TeableAuth } from '../auth';
import { teableOutputSchemas } from '../output-schemas';

const MAX_TOTAL_RECORDS = 5000;

export const findRecordsAction = createAction({
  auth: TeableAuth,
  name: 'teable_list_records',
  classification: 'SEARCH',
  displayName: 'List Records',
  description: 'Finds records in a table, with optional filter, search and sort.',
  audience: 'human',
  aiMetadata: {
    description:
      'Lists records from a Teable table, optionally narrowed by a filter expression, a view, or a search term. Read-only and safe to retry.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'table',
      display: 'section',
      label: 'Table',
      icon: 'inbox',
      props: ['base_id', 'table_id', 'view_id'],
    },
    {
      key: 'find',
      display: 'section',
      label: 'Find Records',
      icon: 'filter',
      props: ['search', 'filter_help', 'filter', 'selectedRecordIds'],
    },
    {
      key: 'results',
      display: 'section',
      label: 'Results',
      icon: 'sliders',
      props: ['take', 'orderBy'],
    },
  ],
  props: {
    base_id: TeableCommon.base_id,
    table_id: TeableCommon.table_id,
    view_id: TeableCommon.view_id,
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Only return records containing this text in any field.',
      placeholder: 'Jane',
      required: false,
    }),
    filter_help: Property.MarkDown({
      value:
        "Build a Filter with [Teable's query builder](https://app.teable.ai/developer/tool/query-builder) and paste the JSON here.",
      variant: MarkdownVariant.INFO,
    }),
    filter: Property.LongText({
      displayName: 'Filter',
      description: "A JSON filter expression from Teable's query builder.",
      placeholder: '{"conjunction": "and", "filterSet": []}',
      required: false,
    }),
    selectedRecordIds: Property.Array({
      displayName: 'Record IDs',
      description: 'Only return these records.',
      required: false,
    }),
    take: Property.Number({
      displayName: 'Max Records',
      description: 'Records to return, 1 to 5000. Default 100.',
      required: false,
      defaultValue: 100,
    }),
    orderBy: Property.LongText({
      displayName: 'Order By',
      description:
        'A JSON array of sort rules, each a field ID and asc or desc.',
      placeholder: '[{"fieldId": "fldXXXXXXXXXXXXXXX", "order": "asc"}]',
      required: false,
    }),
    skip: Property.Number({
      displayName: 'Skip',
      description: 'Rows to skip before collecting results.',
      required: false,
      advanced: true,
      defaultValue: 0,
    }),
    cellFormat: Property.StaticDropdown({
      displayName: 'Cell Format',
      description: 'JSON returns raw values; Text returns them as shown in Teable.',
      required: false,
      advanced: true,
      defaultValue: 'json',
      options: {
        options: [
          { label: 'JSON', value: 'json' },
          { label: 'Text', value: 'text' },
        ],
      },
    }),
  },
  outputSchema: teableOutputSchemas.listRecords,
  async run(context) {
    const {
      table_id,
      view_id,
      filter,
      search,
      orderBy,
      cellFormat,
      take,
      skip,
      selectedRecordIds,
    } = context.propsValue;
    const limit = Number(take ?? 100);
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_TOTAL_RECORDS) {
      throw new Error(`Max Records must be a whole number between 1 and ${MAX_TOTAL_RECORDS}.`);
    }
    const offset = Number(skip ?? 0);
    if (!Number.isInteger(offset) || offset < 0) {
      throw new Error('Skip must be a whole number of 0 or more.');
    }
    const recordIds = (selectedRecordIds ?? []).map((id) => String(id));
    const { records, hasMore } = await teableClient.listRecordsPaged({
      auth: context.auth,
      tableId: table_id,
      maxRecords: limit,
      skip: offset,
      query: {
        viewId: view_id,
        filter,
        search: search !== undefined && search !== '' ? [search, '', 'true'] : undefined,
        orderBy,
        cellFormat,
        selectedRecordIds: recordIds.length > 0 ? recordIds : undefined,
      },
    });
    return { records, recordCount: records.length, hasMore };
  },
});
