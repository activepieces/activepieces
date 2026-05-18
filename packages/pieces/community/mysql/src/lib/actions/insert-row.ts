import { createAction, Property } from '@activepieces/pieces-framework';
import { mysqlCommon, mysqlConnect, sanitizeColumnName, warningMarkdown } from '../common';
import { mysqlAuth } from '../..';
import sqlstring from 'sqlstring';

export default createAction({
  auth: mysqlAuth,
  name: 'insert_row',
  displayName: 'Insert Row',
  description: 'Inserts a new row into a table',
  props: {
    timezone: mysqlCommon.timezone,
    table: mysqlCommon.table(),
    values: Property.Object({
      displayName: 'Values',
      required: true,
    }),
  },
  async run(context) {
    const fields = Object.keys(context.propsValue.values);
    const qsFields = fields.map((f) => sanitizeColumnName(f)).join(',');
    const qsValues = fields.map(() => '?').join(',');
    const qs = `INSERT INTO ${sanitizeColumnName(context.propsValue.table)} (${qsFields}) VALUES (${qsValues});`;
    const conn = await mysqlConnect(context.auth, context.propsValue);
    try {
      const values = fields.map((f) => context.propsValue.values[f]);
      const result = await conn.query(qs, values);
      return result;
    } finally {
      await conn.end();
    }
  },
});
