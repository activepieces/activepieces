import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleDbAuth } from '../common/auth';
import { OracleDbClient } from '../common/client';

export const runCustomSqlAction = createAction({
  auth: oracleDbAuth,
  name: 'run_custom_sql',
  displayName: 'Run Custom SQL',
  description: 'Execute custom SQL or PL/SQL in Oracle',
  audience: 'both',
  aiMetadata: { description: 'Executes an arbitrary SQL or PL/SQL statement against Oracle Database, with optional named bind parameters (:param). Use as the escape hatch for queries the structured row actions cannot express (joins, aggregates, DDL, fetch/delete all rows). Idempotency depends on the statement — a SELECT is safe to repeat, but any INSERT/UPDATE/DELETE/DDL mutates and is not; pass user-supplied values via binds to avoid SQL injection.', idempotent: false },
  props: {
    markdown: Property.MarkDown({
      value: `**DO NOT** insert dynamic input directly into the query. Use bind parameters (:param) to prevent **SQL injection**.`,
    }),
    sql: Property.LongText({
      displayName: 'SQL Query',
      description: 'SQL or PL/SQL to execute. Use :param for bind parameters.',
      required: true,
      defaultValue: 'SELECT * FROM employees WHERE department_id = :dept_id',
    }),
    binds: Property.Object({
      displayName: 'Bind Parameters',
      description: 'Key-value pairs for bind variables',
      required: false,
      defaultValue: { dept_id: 90 },
    }),
  },
  async run(context) {
    const { sql, binds } = context.propsValue;
    
    try {
      const client = new OracleDbClient(context.auth.props);
      const bindParams = (binds as Record<string, unknown>) ?? {};
      return await client.execute(sql, bindParams);
    } catch (error) {
      throw new Error(
        `Failed to execute SQL: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
});
