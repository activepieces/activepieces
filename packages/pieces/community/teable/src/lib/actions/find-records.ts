import { Property, createAction } from '@activepieces/pieces-framework';
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
  description:
    'Retrieves records from a table with optional filtering, search, and sorting, paging through results automatically.',
  audience: 'human',
  aiMetadata: {
    description:
      'Lists records from a Teable table, optionally narrowed by a filter expression, a view, or a search term. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    base_id: TeableCommon.base_id,
    table_id: TeableCommon.table_id,
    view_id: TeableCommon.view_id,
    filter: Property.LongText({
      displayName: 'Filter',
      description:
        'A filter expression for the records. Use the visual query builder at https://app.teable.ai/developer/tool/query-builder to build one.',
      required: false,
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Only return records containing this text in any field.',
      required: false,
    }),
    orderBy: Property.LongText({
      displayName: 'Order By',
      description:
        'A JSON array of sort conditions.',
      required: false,
    }),
    cellFormat: Property.StaticDropdown({
      displayName: 'Cell Format',
      description: 'The format of the cell values in the response.',
      required: false,
      defaultValue: 'json',
      options: {
        options: [
          { label: 'JSON', value: 'json' },
          { label: 'Text', value: 'text' },
        ],
      },
    }),
    take: Property.Number({
      displayName: 'Max Records',
      description: `The maximum number of records to return (1-${MAX_TOTAL_RECORDS}). The action pages through the table automatically.`,
      required: false,
      defaultValue: 100,
    }),
    skip: Property.Number({
      displayName: 'Skip',
      description: 'The number of records to skip before collecting results.',
      required: false,
      defaultValue: 0,
    }),
    selectedRecordIds: Property.Array({
      displayName: 'Selected Record IDs',
      description: 'Only return the records with these IDs.',
      required: false,
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
