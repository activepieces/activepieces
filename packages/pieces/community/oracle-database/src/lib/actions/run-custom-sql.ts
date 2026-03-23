import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleDbAuth } from '../common/auth';
import { OracleDbClient } from '../common/client';
import oracledb from 'oracledb';

export const runCustomSqlAction = createAction({
  auth: oracleDbAuth,
  name: 'run_custom_sql',
  displayName: 'Run Custom SQL',
  description: 'Execute custom SQL or PL/SQL in Oracle',
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
      const bindParams = (binds as oracledb.BindParameters) || {};
      return await client.execute(sql, bindParams);
    } catch (error) {
      throw new Error(
        `Failed to execute SQL: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
});
