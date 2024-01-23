import { createAction, Property } from '@activepieces/pieces-framework';
import { mysqlCommon, mysqlConnect } from '../common';
import { mysqlAuth } from '../..';

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
      description: 'Values to be inserted into the row',
      required: true,
    }),
  },
  async run(context) {
    const fields = Object.keys(context.propsValue.values);
    const values = fields.map((f) => context.propsValue.values[f]);
    const qsFields = fields.map((f) => '`' + f + '`').join(',');
    const qsValues = fields.map((f) => '?').join(',');
    const qs =
      'INSERT INTO `' +
      context.propsValue.table +
      '` (' +
      qsFields +
      ') VALUES (' +
      qsValues +
      ');';
    const conn = await mysqlConnect(context.auth, context.propsValue);
    try {
      const result = await conn.query(qs, values);
      return result;
    } finally {
      await conn.end();
    }
  },
});
