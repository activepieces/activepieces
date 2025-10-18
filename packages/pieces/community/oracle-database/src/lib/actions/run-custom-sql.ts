import { createAction } from '@activepieces/pieces-framework';
import { oracleDbAuth } from '../common/auth';
import { OracleDbClient } from '../common/client';
import { oracleDbProps } from '../common/props';
// eslint-disable-next-line @nx/enforce-module-boundaries
import oracledb from 'oracledb';

export const runCustomSqlAction = createAction({
  auth: oracleDbAuth,
  name: 'run_custom_sql',
  displayName: 'Run Custom SQL',
  description: 'Execute a custom SQL query or PL/SQL block.',
  props: {
    sql: oracleDbProps.sql(),
    binds: oracleDbProps.binds(),
  },
  async run(context) {
    const { sql, binds } = context.propsValue;
    const client = new OracleDbClient(context.auth);
    const bindParams = (binds as oracledb.BindParameters) || {};
    return await client.execute(sql, bindParams);
  },
});
