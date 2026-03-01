import { createAction, Property } from '@activepieces/pieces-framework';
import { mysqlCommon, mysqlConnect, sanitizeColumnName } from '../common';
import { mysqlAuth } from '../..';
import sqlstring from 'sqlstring';

export default createAction({
  auth: mysqlAuth,
  name: 'update_row',
  displayName: 'Update Row',
  description: 'Updates one or more rows in a table',
  props: {
    timezone: mysqlCommon.timezone,
    table: mysqlCommon.table(),
    values: Property.Object({
      displayName: 'Values',
      required: true,
    }),
    search_column: Property.ShortText({
      displayName: 'Search Column',
      required: true,
    }),
    search_value: Property.ShortText({
      displayName: 'Search Value',
      required: true,
    }),
  },
  async run(context) {
    const fields = Object.keys(context.propsValue.values);
    const qsValues = fields.map((f) => sanitizeColumnName(f) + '=?').join(',');
    const qs = `UPDATE ${sanitizeColumnName(context.propsValue.table)} SET ${qsValues} WHERE ${sqlstring.escape(context.propsValue.search_column)}=?;`;
    const conn = await mysqlConnect(context.auth, context.propsValue);
    try {
    const values = fields.map((f) => context.propsValue.values[f]);
      const result = await conn.query(qs, [
        ...values,
        context.propsValue.search_value,
      ]);
      return result;
    } finally {
      await conn.end();
    }
  },
});
