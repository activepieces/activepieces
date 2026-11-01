import { Property, createAction } from '@activepieces/pieces-framework';
import { TeableAuth } from '../auth';
import { TeableCommon } from '../common';
import { teableClient } from '../common/client';
import { teableOutputSchemas } from '../output-schemas';

const MAX_BATCH_SIZE = 1000;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseRecordsInput(value: unknown): { fields: Record<string, unknown> }[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(
      'Records must be a non-empty JSON array of objects keyed by field name, e.g. [{"Name": "Jane"}, {"Name": "Joe"}].'
    );
  }
  if (value.length > MAX_BATCH_SIZE) {
    throw new Error(`Records holds ${value.length} items; the maximum per call is ${MAX_BATCH_SIZE}.`);
  }
  return value.map((item, index) => {
    if (!isPlainObject(item)) {
      throw new Error(`Records item ${index + 1} must be an object keyed by field name.`);
    }
    const entries = Object.entries(item).filter(([, v]) => v !== undefined && v !== null && v !== '');
    if (entries.length === 0) {
      throw new Error(`Records item ${index + 1} has no field values.`);
    }
    return { fields: Object.fromEntries(entries) };
  });
}

export const createRecordsAction = createAction({
  auth: TeableAuth,
  name: 'teable_create_records',
  classification: 'WRITE',
  displayName: 'Create Records',
  description: 'Creates multiple records in a Teable table in one call.',
  audience: 'both',
  aiMetadata: {
    description:
      'Adds up to 1000 new rows to a Teable table in one call. Records is a JSON array of objects keyed by field name. Each call appends all records again, so a retry makes duplicates.',
    idempotent: false,
  },
  props: {
    base_id: TeableCommon.base_id,
    table_id: TeableCommon.table_id,
    records: Property.Json({
      displayName: 'Records',
      description:
        'A JSON array of records, each an object keyed by field name.',
      required: true,
    }),
  },
  outputSchema: teableOutputSchemas.createRecord,
  async run(context) {
    const records = parseRecordsInput(context.propsValue.records);
    return teableClient.createRecords({
      auth: context.auth,
      tableId: context.propsValue.table_id,
      records,
      typecast: true,
    });
  },
});
