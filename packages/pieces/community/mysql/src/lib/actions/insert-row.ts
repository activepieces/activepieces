import { createAction, Property } from '@activepieces/pieces-framework';
import { mysqlCommon, mysqlConnect, sanitizeColumnName } from '../common';
import { mysqlAuth } from '../..';
import { insertRowOutputSchema } from '../output-schemas';

export default createAction({
  auth: mysqlAuth,
  name: 'insert_row',
  displayName: 'Insert Row',
  description: 'Inserts a new row into a table',
  audience: 'both',
  outputSchema: insertRowOutputSchema,
  aiMetadata: { description: 'Inserts a new row into a MySQL table from a map of column names to values. Use to add a record. Not idempotent: each call performs a fresh INSERT, so repeating it adds duplicate rows (or errors on a unique-key collision).', idempotent: false },
  props: {
    timezone: mysqlCommon.timezone,
    table: mysqlCommon.table(),
    values: Property.Object({
      displayName: 'Values',
      description: 'Column names and the values to store in them.',
      required: true,
    }),
  },
  propertyGroups: [
    {
      key: 'row',
      display: 'section',
      label: 'Row to insert',
      icon: 'inbox',
      props: ['table', 'values'],
    },
  ],
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
