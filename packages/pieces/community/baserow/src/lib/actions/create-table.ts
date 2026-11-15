import { createAction, Property } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { makeClient } from '../common';
import { baserowAiHelpers } from '../common/ai-helpers';
import { createTableOutputSchema } from '../output-schemas';

export const createTableAction = createAction({
  name: 'baserow_create_table',
  classification: 'WRITE',
  outputSchema: createTableOutputSchema,
  displayName: 'Create Table',
  description: 'Creates a table in a database, optionally seeded with rows.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new table in a Baserow database. Pass Data as rows of cell values; with First Row Is Header the first row becomes the field names and all fields are created as text. Without Data the table gets a single "Name" field and no rows. Add typed fields afterwards with Create Field. Requires an Email & Password connection. Not idempotent — each call creates another table.',
    idempotent: false,
  },
  auth: baserowAuth,
  props: {
    database_id: Property.Number({
      displayName: 'Database ID',
      description: 'The database to create the table in. Resolve with List Databases.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name of the new table.',
      required: true,
    }),
    data: Property.Json({
      displayName: 'Data',
      description:
        'Optional JSON array of rows, each an array of cell values, e.g. [["Name", "Email"], ["Ada", "ada@example.com"]].',
      required: false,
    }),
    first_row_header: Property.Checkbox({
      displayName: 'First Row Is Header',
      description: 'Use the first row of Data as the field names.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { database_id, name, data, first_row_header } = context.propsValue;
    baserowAiHelpers.assertJwt({ auth: context.auth, actionName: 'Create Table' });
    const rows = data === undefined || data === null ? [['Name']] : toRows({ value: data });
    const firstRowHeader = data === undefined || data === null ? true : first_row_header ?? true;
    const client = await makeClient(context.auth);
    const table = await baserowAiHelpers.execute(() =>
      client.createTable({ databaseId: database_id, name, data: rows, firstRowHeader })
    );
    return { id: table['id'], name: table['name'], database_id: table['database_id'] };
  },
});

function toRows({ value }: { value: unknown }): unknown[][] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('Data must be a non-empty JSON array of rows.');
  }
  return value.map((row, index) => {
    if (!Array.isArray(row)) {
      throw new Error(`Data[${index}] must be an array of cell values.`);
    }
    return row;
  });
}
