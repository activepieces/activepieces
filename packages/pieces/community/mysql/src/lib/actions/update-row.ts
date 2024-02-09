import { createAction, Property } from '@activepieces/pieces-framework';
import { mysqlCommon, mysqlConnect, sanitizeColumnName } from '../common';
import { mysqlAuth } from '../..';

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
      description: 'Values to be updated',
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
    const values = fields.map((f) => context.propsValue.values[f]);
    const qsValues = fields.map((f) => '`' + f + '`=?').join(',');
    const qs =
      'UPDATE `' +
      context.propsValue.table +
      '` SET ' +
      qsValues +
      ' WHERE ' +
      sanitizeColumnName(context.propsValue.search_column) +
      '=?;';
    const conn = await mysqlConnect(context.auth, context.propsValue);
    try {
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
