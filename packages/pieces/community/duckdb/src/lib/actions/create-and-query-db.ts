import { createAction, Property } from '@activepieces/pieces-framework';

import { DuckDBInstance } from '@duckdb/node-api';

export const createAndQueryDB = createAction({
  name: 'createAndQueryDB',
  displayName: 'Create and Query DB',
  description: 'Create DB from data and run query',
  props: {
    markdown: Property.MarkDown({
      value: `
      **DO NOT** insert dynamic input directly into the query string. Instead, use $1, $2, $3 and add them in args for parameterized queries to prevent **SQL injection.**`,
    }),
    tables: Property.Array({
      displayName: 'Tables',
      description: 'List of tables to create in the database',
      required: true,
      properties: {
        name: Property.ShortText({
          displayName: 'Table Name',
          description: 'Name of the table to create',
          required: true,
        }),
        data: Property.Json({
          displayName: 'JSON Data',
          description:
            'Table data in the form of a JSON array of objects. Object keys would be taken as column names.',
          required: true,
          defaultValue: [],
        }),
        schema: Property.Json({
          displayName: 'Schema in JSON format',
          description: `
Provide the schema as a JSON object. Note that only the specified columns would be loaded.
Leave empty to autodetect schema, although it is recommended to specify the schema for consistency and avoid unexpected behaviour.

More information on data types and accepted values:
- https://duckdb.org/2023/03/03/json
- https://duckdb.org/docs/stable/sql/data_types/overview
          `.trim(),
          required: false,
          defaultValue: {},
        }),
      },
    }),
    query: Property.ShortText({
      displayName: 'Query',
      description:
        'Please use $1, $2, etc. for parameterized queries to avoid SQL injection.',
      required: true,
    }),
    args: Property.Array({
      displayName: 'Arguments',
      description: 'Arguments to be used in the query',
      required: false,
    }),
  },
  async run(context) {
    const instance = await DuckDBInstance.create(':memory:');
    const connection = await instance.connect();

    await connection.run(`
      SET enable_logging = 0;
      SET enable_external_access = false;
      SET lock_configuration = true;
    `);

    const dbTables: any[] = context.propsValue.tables ?? [];
    for (const dbTable of dbTables) {
      const dbData = JSON.stringify(dbTable.data);
      let dbSchema = null;

      if (dbTable.schema) {
        dbSchema = JSON.stringify([dbTable.schema]);
      } else {
        const schemaResult = await connection.run(
          'SELECT json_structure($sourceData) AS schema',
          { sourceData: dbData }
        );

        const detectedSchema = await schemaResult.getRows();
        dbSchema = detectedSchema[0][0];
      }

      await connection.run(
        `
          CREATE TABLE ${dbTable.name} AS
            SELECT UNNEST(JSON_TRANSFORM($sourceData, $sourceSchema), recursive := true);
        `,
        {
          sourceData: dbData,
          sourceSchema: dbSchema,
        }
      );
    }

    const queryArgs = context.propsValue.args ?? [];
    const formattedArgs: Record<string, any> = {};
    for (let i = 0; i < queryArgs.length; i++) {
      const idx = (i + 1).toString();
      formattedArgs[idx] = queryArgs[i];
    }

    const reader = await connection.runAndReadAll(
      context.propsValue.query,
      formattedArgs
    );

    const results = reader.getRowObjectsJson();

    connection.closeSync();

    return results;
  },
});
