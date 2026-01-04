import { createAction, Property } from '@activepieces/pieces-framework';

import { tmpdir } from 'os';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { DuckDBInstance, VARCHAR } from '@duckdb/node-api';

export const createAndQueryDB = createAction({
  name: 'createAndQueryDB',
  displayName: 'Create and Query DB',
  description: 'Create DB from files and run query',
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
        dataType: Property.StaticDropdown({
          displayName: 'Source Data Type',
          required: true,
          options: {
            disabled: false,
            options: [
              {
                label: 'CSV',
                value: 'csv',
              },
              {
                label: 'JSON',
                value: 'json',
              },
            ],
          },
        }),
        dataUrl: Property.ShortText({
          displayName: 'Source Data URL',
          description: 'URL to file containing the source data',
          required: true,
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
    // https://duckdb.org/docs/stable/extensions/installing_extensions#installation-location
    const tempExtensionDir = join(
      tmpdir(),
      `activepieces-duckdb`,
      'extensions'
    );
    mkdirSync(tempExtensionDir, { recursive: true });

    const instance = await DuckDBInstance.create(':memory:');
    const connection = await instance.connect();

    await connection.run(`
      SET enable_logging = 0;
      SET extension_directory='${tempExtensionDir}';
      INSTALL httpfs;
      LOAD httpfs;
    `);

    const dbTables: any[] = context.propsValue.tables;
    for (const dbTable of dbTables) {
      let createTableQuery: string;

      switch (dbTable.dataType) {
        case 'csv':
          createTableQuery = `
            CREATE TABLE ${dbTable.name} AS
              SELECT *
              FROM read_csv($sourceData,
                delim = ',',  
                header = true
              );
          `;
          break;
        case 'json':
          createTableQuery = `
            CREATE TABLE ${dbTable.name} AS
              SELECT *
              FROM read_json($sourceData);
          `;
          break;
        default:
          throw new Error(`Unsupported source data type: ${dbTable.dataType}`);
      }

      await connection.run(
        createTableQuery,
        {
          sourceData: dbTable.dataUrl,
        },
        {
          sourceData: VARCHAR,
        }
      );
    }

    await connection.run(`
      SET enable_external_access = false;
    `);

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
