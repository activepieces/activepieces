import { Property, createAction } from '@activepieces/pieces-framework';
import { TeableAuth } from '../auth';
import { teableAgent } from '../common/agent';
import { TeableAgentProps } from '../common';
import { teableClient } from '../common/client';
import { teableOutputSchemas } from '../output-schemas';

const MAX_LIMIT = 1000;

export const searchRecordsAi = createAction({
  auth: TeableAuth,
  name: 'search_records_ai',
  classification: 'SEARCH',
  displayName: 'Search Records (Agent)',
  description: 'Finds records in a Teable table by text or field values.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Finds records in a Teable table. Give a search text (matched against all fields), a JSON object of exact field values ({"Status": "Open"}), or both; with neither it lists the first records. Agents: use this instead of List Records. Needs the base ID and the table name or ID. Returns {records, recordCount, hasMore} with field values keyed by field name. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    baseId: TeableAgentProps.base_id,
    table: TeableAgentProps.table,
    search: Property.ShortText({
      displayName: 'Search Text',
      description: 'Only return records containing this text in any field.',
      required: false,
    }),
    filters: Property.Json({
      displayName: 'Field Filters',
      description:
        'Exact matches keyed by field name or ID; all conditions must match.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: `The maximum number of records to return (1-${MAX_LIMIT}).`,
      required: false,
      defaultValue: 50,
    }),
  },
  outputSchema: teableOutputSchemas.searchRecords,
  async run({ auth, propsValue }) {
    const baseId = teableAgent.requireText({ value: propsValue.baseId, label: 'Base ID' });
    const reference = teableAgent.requireText({ value: propsValue.table, label: 'Table' });
    const limit = Number(propsValue.limit ?? 50);
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
      throw new Error(`Limit must be a whole number between 1 and ${MAX_LIMIT}.`);
    }
    const table = await teableAgent.resolveTable({ auth, baseId, reference });
    const fields = await teableClient.listFields({ auth, tableId: table.id });
    const searchText =
      typeof propsValue.search === 'string' && propsValue.search.trim().length > 0
        ? propsValue.search.trim()
        : undefined;
    const filterInput =
      propsValue.filters === undefined || propsValue.filters === null
        ? {}
        : teableAgent.parseFieldsInput(propsValue.filters);
    const filterSet = Object.entries(filterInput).map(([key, value]) => {
      const field = teableAgent.findColumn({ fields, reference: key });
      if (value === undefined || value === null || typeof value === 'object') {
        throw new Error(
          `Field Filters value for "${field.name}" must be a single text, number, or boolean value.`
        );
      }
      return { fieldId: field.id, operator: 'is', value };
    });
    const { records, hasMore } = await teableClient.listRecordsPaged({
      auth,
      tableId: table.id,
      maxRecords: limit,
      query: {
        search: searchText !== undefined ? [searchText, '', 'true'] : undefined,
        filter:
          filterSet.length > 0
            ? JSON.stringify({ conjunction: 'and', filterSet })
            : undefined,
      },
    });
    return { records, recordCount: records.length, hasMore };
  },
});
