import { Property, createAction } from '@activepieces/pieces-framework';
import { TeableAuth } from '../auth';
import { TeableCommon } from '../common';
import { teableClient } from '../common/client';
import { teableOutputSchemas } from '../output-schemas';

const MAX_BATCH_SIZE = 1000;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseUpdatesInput(value: unknown): { id: string; fields: Record<string, unknown> }[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(
      'Records must be a non-empty JSON array of objects with "id" and "fields", e.g. [{"id": "recXXX", "fields": {"Name": "Jane"}}].'
    );
  }
  if (value.length > MAX_BATCH_SIZE) {
    throw new Error(`Records holds ${value.length} items; the maximum per call is ${MAX_BATCH_SIZE}.`);
  }
  return value.map((item, index) => {
    if (!isPlainObject(item)) {
      throw new Error(`Records item ${index + 1} must be an object with "id" and "fields".`);
    }
    const id = item['id'];
    const fields = item['fields'];
    if (typeof id !== 'string' || id.trim().length === 0) {
      throw new Error(`Records item ${index + 1} is missing a record "id".`);
    }
    if (!isPlainObject(fields) || Object.keys(fields).length === 0) {
      throw new Error(
        `Records item ${index + 1} must carry a non-empty "fields" object (use null as a value to clear a field).`
      );
    }
    return {
      id: id.trim(),
      fields: Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined)),
    };
  });
}

export const updateRecordsAction = createAction({
  auth: TeableAuth,
  name: 'teable_update_records',
  classification: 'WRITE',
  displayName: 'Update Records',
  description: 'Updates multiple records in a Teable table in one call.',
  audience: 'both',
  aiMetadata: {
    description:
      'Changes up to 1000 existing rows in one call. Records is a JSON array of {"id", "fields"} objects; a field value of null clears that field. Safe to retry with the same values.',
    idempotent: true,
  },
  props: {
    base_id: TeableCommon.base_id,
    table_id: TeableCommon.table_id,
    records: Property.Json({
      displayName: 'Records',
      description:
        'A JSON array of updates with record IDs; a null field value clears it.',
      required: true,
    }),
  },
  outputSchema: teableOutputSchemas.updatedRecords,
  async run(context) {
    const records = parseUpdatesInput(context.propsValue.records);
    return teableClient.updateRecords({
      auth: context.auth,
      tableId: context.propsValue.table_id,
      records,
      typecast: true,
    });
  },
});
