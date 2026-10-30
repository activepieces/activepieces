import { Property, createAction } from '@activepieces/pieces-framework';
import { TeableCommon } from '../common';
import { teableClient } from '../common/client';
import { TeableAuth } from '../auth';
import { teableOutputSchemas } from '../output-schemas';

export const findRecordAction = createAction({
  auth: TeableAuth,
  name: 'teable_get_record',
  classification: 'READ',
  displayName: 'Get Record',
  description: 'Retrieves a single record from a table by its ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches one record by its exact record ID and returns its current field values. For lookups by value use Search Records (Agent). Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    base_id: TeableCommon.base_id,
    table_id: TeableCommon.table_id,
    record_id: TeableCommon.record_id,
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
  },
  outputSchema: teableOutputSchemas.record,
  async run(context) {
    const { table_id, record_id, cellFormat } = context.propsValue;
    return teableClient.getRecord({
      auth: context.auth,
      tableId: table_id,
      recordId: record_id,
      query: { cellFormat },
    });
  },
});
