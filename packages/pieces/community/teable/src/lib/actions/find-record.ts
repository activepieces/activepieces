import {
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { TeableCommon, makeClient } from '../common';
import { TeableAuth, TeableAuthValue } from '../auth';
import { prepareQuery } from '../common/client';

export const findRecordAction = createAction({
  auth: TeableAuth,
  name: 'teable_get_record',
  displayName: 'Get Record',
  description: 'Retrieves a single record from a table by its ID.',
  audience: 'both',
  aiMetadata: {
    description: 'Fetches one record from a Teable table by its exact record ID. Use when the agent already knows the record ID and needs its current field values; for lookups by field value use List Records with a filter instead. Read-only and idempotent.',
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
  async run(context) {
    const { table_id, record_id, cellFormat } = context.propsValue;
    const client = makeClient(context.auth as TeableAuthValue);
    return await client.getRecord(table_id, record_id, prepareQuery({ cellFormat }));
  },
});
