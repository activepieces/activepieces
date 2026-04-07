import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { stitchAuth } from '../../';
import { makeImportRequest } from '../common';

export const validateDataAction = createAction({
  auth: stitchAuth,
  name: 'validate_data',
  displayName: 'Validate Records',
  description:
    'Validates a batch of records against the Stitch Import API format without persisting them. ' +
    'Use this to test your data structure before pushing it live.',
  props: {
    table_name: Property.ShortText({
      displayName: 'Table Name',
      description: 'The name of the table the records belong to (e.g. "my_events").',
      required: true,
    }),
    key_names: Property.Array({
      displayName: 'Primary Key Fields',
      description:
        'The field names that act as primary keys for this table. Example: ["id"].',
      required: true,
    }),
    records: Property.Json({
      displayName: 'Records',
      description:
        'An array of flat JSON objects to validate. ' +
        'Example: [{"id": 1, "name": "Alice"}].',
      required: true,
      defaultValue: [],
    }),
  },
  async run(context) {
    const auth = context.auth as unknown as {
      connect_api_token: string;
      import_api_token: string;
      client_id: string;
    };
    const sequence = Date.now();
    const result = await makeImportRequest<{ status: string; message: string }>(
      auth,
      HttpMethod.POST,
      '/import/validate',
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
      records_validated: Array.isArray(context.propsValue.records)
        ? (context.propsValue.records as unknown[]).length
        : 0,
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
