import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { stitchAuth } from '../../';
import { makeImportRequest } from '../common';

export const pushDataAction = createAction({
  auth: stitchAuth,
  name: 'push_data',
  displayName: 'Push Records',
  description:
    'Pushes one or more records directly into your Stitch data pipeline. ' +
    'Stitch will load them into your connected destination.',
  props: {
    table_name: Property.ShortText({
      displayName: 'Table Name',
      description:
        'The name of the destination table where the records will be written. ' +
        'Use lowercase letters and underscores only (e.g. "my_events").',
      required: true,
    }),
    key_names: Property.Array({
      displayName: 'Primary Key Fields',
      description:
        'The field names that uniquely identify each record (primary keys). ' +
        'These are used by Stitch to upsert records and avoid duplicates. ' +
        'Example: ["id"] or ["order_id", "line_item_id"].',
      required: true,
    }),
    records: Property.Json({
      displayName: 'Records',
      description:
        'An array of flat JSON objects to push. Each object represents one row. ' +
        'All objects should have consistent keys. ' +
        'Example: [{"id": 1, "name": "Alice", "created_at": "2024-01-01T00:00:00Z"}].',
      required: true,
      defaultValue: [],
    }),
    sequence: Property.Number({
      displayName: 'Sequence (optional)',
      description:
        'A unique, monotonically increasing number used to order records. ' +
        'Defaults to the current Unix timestamp in milliseconds. ' +
        'Only change this if you are replaying historical records.',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth as unknown as {
      connect_api_token: string;
      import_api_token: string;
      client_id: string;
    };
    const sequence = context.propsValue.sequence ?? Date.now();
    const result = await makeImportRequest<{ status: string; message: string }>(
      auth,
      HttpMethod.POST,
      '/import/batch',
      {
        table_name: context.propsValue.table_name,
        schema: {
          properties: buildSchemaFromRecords(
            context.propsValue.records as unknown as Record<string, unknown>[]
          ),
        },
        key_names: context.propsValue.key_names,
        messages: (context.propsValue.records as unknown as Record<string, unknown>[]).map(
          (record) => ({
            action: 'upsert',
            sequence,
            data: record,
          })
        ),
      }
    );
    return {
      status: result.status,
      message: result.message,
      records_pushed: Array.isArray(context.propsValue.records)
        ? (context.propsValue.records as unknown[]).length
        : 0,
      table_name: context.propsValue.table_name,
    };
  },
});

function buildSchemaFromRecords(
  records: Record<string, unknown>[]
): Record<string, { type: string[] }> {
  if (!records || records.length === 0) return {};
  const schema: Record<string, { type: string[] }> = {};
  const sample = records[0];
  for (const key of Object.keys(sample)) {
    const value = sample[key];
    if (value === null || value === undefined) {
      schema[key] = { type: ['null', 'string'] };
    } else if (typeof value === 'number') {
      schema[key] = { type: ['null', 'number'] };
    } else if (typeof value === 'boolean') {
      schema[key] = { type: ['null', 'boolean'] };
    } else {
      schema[key] = { type: ['null', 'string'] };
    }
  }
  return schema;
}
