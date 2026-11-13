import { createAction } from '@activepieces/pieces-framework';
import { postgresAuth } from '../../../auth';
import { postgresAi, postgresAiProps } from '../../../ai-common';
import { postgresDescribeTableOutputSchema } from '../../../output-schemas';

export const describeTable = createAction({
  auth: postgresAuth,
  name: 'postgres_describe_table',
  outputSchema: postgresDescribeTableOutputSchema,
  displayName: 'Describe Table',
  description: 'Lists the columns of a table or view with their types, keys, references and defaults.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns every column of a table or view in order: name, type, nullability, default, identity and generated flags, whether it is part of the primary key, and the schema.table.column it references through a foreign key. Use before reading or writing rows to learn column names, required columns, the primary key and how tables join. Table names come from Get Tables or List Views. Read-only.',
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
        const columns = await client.query<ColumnRow>(
          `SELECT a.attname AS name, format_type(a.atttypid, a.atttypmod) AS type, NOT a.attnotnull AS nullable, pg_get_expr(d.adbin, d.adrelid) AS "defaultValue", a.attidentity <> '' AS "isIdentity", a.attgenerated <> '' AS "isGenerated", col_description(a.attrelid, a.attnum) AS comment FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum WHERE a.attrelid = $1::oid AND a.attnum > 0 AND NOT a.attisdropped ORDER BY a.attnum`,
          [relation.oid],
        );
        const references = await client.query<ReferenceRow>(
          `SELECT a.attname AS column, fn.nspname AS "refSchema", fc.relname AS "refTable", fa.attname AS "refColumn" FROM pg_constraint con JOIN LATERAL unnest(con.conkey, con.confkey) AS k(attnum, fattnum) ON true JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = k.attnum JOIN pg_class fc ON fc.oid = con.confrelid JOIN pg_namespace fn ON fn.oid = fc.relnamespace JOIN pg_attribute fa ON fa.attrelid = con.confrelid AND fa.attnum = k.fattnum WHERE con.conrelid = $1::oid AND con.contype = 'f'`,
          [relation.oid],
        );
        const primaryKey = await postgresAi.primaryKeyColumns({ client, oid: relation.oid });
        return {
          schema: relation.schema,
          table: relation.name,
          primaryKey,
          columns: columns.rows.map((column) => {
            const reference = references.rows.find((row) => row.column === column.name);
            return {
              ...column,
              isPrimaryKey: primaryKey.includes(column.name),
              references: reference === undefined ? null : `${reference.refSchema}.${reference.refTable}.${reference.refColumn}`,
            };
          }),
          count: columns.rows.length,
        };
      },
    });
  },
});

type ColumnRow = {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
  isIdentity: boolean;
  isGenerated: boolean;
  comment: string | null;
};

type ReferenceRow = {
  column: string;
  refSchema: string;
  refTable: string;
  refColumn: string;
};
