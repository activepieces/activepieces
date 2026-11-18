import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from 'pg';
import format from 'pg-format';
import { postgresAuth } from '../../../auth';
import { postgresAi, postgresAiProps } from '../../../ai-common';
import { postgresGetRowByKeyOutputSchema } from '../../../output-schemas';

export const getRowByKey = createAction({
  auth: postgresAuth,
  name: 'postgres_get_row_by_key',
  outputSchema: postgresGetRowByKeyOutputSchema,
  displayName: 'Get Row by Key',
  description: 'Gets one row by its primary key or another unique column.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns the single row whose key column equals the given value, and fails if no row or more than one row matches. Key Column defaults to the table\'s single-column primary key; name a unique column to look up by it instead. Key values come from Insert Rows, Upsert Row or Find Rows. Read-only.',
    idempotent: true,
  },
  props: {
    table: postgresAiProps.table,
    keyValue: Property.ShortText({
      displayName: 'Key Value',
      description: 'The value of the key column, e.g. the id returned by Insert Rows.',
      required: true,
    }),
    keyColumn: Property.ShortText({
      displayName: 'Key Column',
      description: 'A unique column to look up by. Leave empty to use the primary key.',
      required: false,
    }),
  },
  async run(context) {
    const { table, keyColumn, keyValue } = context.propsValue;
    return postgresAi.withClient({
      auth: context.auth,
      fn: async (client) => {
        const relation = await postgresAi.resolveRelation({ client, name: table, label: 'Table' });
        const column = keyColumn !== undefined && keyColumn !== '' ? keyColumn : await primaryKeyColumn({ client, oid: relation.oid, table });
        const result = await client.query(
          `SELECT * FROM ${format('%I.%I', relation.schema, relation.name)} WHERE ${format.ident(column)} = $1 LIMIT 2`,
          [keyValue],
        );
        if (result.rows.length === 0) {
          throw new Error(`No row in "${table}" where ${column} = ${keyValue}.`);
        }
        if (result.rows.length > 1) {
          throw new Error(`More than one row in "${table}" has ${column} = ${keyValue}; that column is not unique. Use Find Rows instead.`);
        }
        return { row: result.rows[0] };
      },
    });
  },
});

async function primaryKeyColumn({ client, oid, table }: { client: Client; oid: string; table: string }): Promise<string> {
  const columns = await postgresAi.primaryKeyColumns({ client, oid });
  if (columns.length !== 1) {
    throw new Error(`Table "${table}" ${columns.length === 0 ? 'has no primary key' : `has a composite primary key (${columns.join(', ')})`}; set Key Column, or use Find Rows.`);
  }
  return columns[0];
}
