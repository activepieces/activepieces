import { createAction } from '@activepieces/pieces-framework';
import { postgresAuth } from '../../../auth';
import { postgresAi, postgresAiProps } from '../../../ai-common';
import { postgresListIndexesOutputSchema } from '../../../output-schemas';

export const listIndexes = createAction({
  auth: postgresAuth,
  name: 'postgres_list_indexes',
  outputSchema: postgresListIndexesOutputSchema,
  displayName: 'List Indexes',
  description: 'Lists the indexes on a table.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists every index on a table with its key columns, method (btree, gin, ...), whether it is unique or the primary key, and its full CREATE INDEX definition. Use to learn which columns lookups and filters are fast on, and which unique keys Upsert Row can use as conflict columns. Table names come from Get Tables. Read-only.',
    idempotent: true,
  },
  props: {
    table: postgresAiProps.table,
  },
  async run(context) {
    const { table } = context.propsValue;
    return postgresAi.withClient({
      auth: context.auth,
      fn: async (client) => {
        const relation = await postgresAi.resolveRelation({ client, name: table, label: 'Table' });
        const result = await client.query(
          `SELECT ic.relname AS name, ARRAY(SELECT pg_get_indexdef(ix.indexrelid, n, true) FROM generate_series(1, ix.indnkeyatts) AS n ORDER BY n) AS columns, am.amname AS method, ix.indisunique AS "isUnique", ix.indisprimary AS "isPrimary", pg_get_indexdef(ix.indexrelid) AS definition FROM pg_index ix JOIN pg_class ic ON ic.oid = ix.indexrelid JOIN pg_am am ON am.oid = ic.relam WHERE ix.indrelid = $1::oid ORDER BY ic.relname`,
          [relation.oid],
        );
        return { schema: relation.schema, table: relation.name, indexes: result.rows, count: result.rows.length };
      },
    });
  },
});
