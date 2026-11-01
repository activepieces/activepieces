import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { mysqlCommon, mysqlConnect, sanitizeColumnName } from '../common';
import { mysqlAuth } from '../..';
import { updateRowOutputSchema } from '../output-schemas';

export default createAction({
  auth: mysqlAuth,
  name: 'update_row',
  displayName: 'Update Row',
  description: 'Updates one or more rows in a table',
  audience: 'both',
  outputSchema: updateRowOutputSchema,
  aiMetadata: { description: 'Updates every row in a MySQL table whose search column equals a given value, setting the supplied column-to-value pairs. Use to modify existing records matched by a single column. Idempotent: re-running with the same input writes the same values and has no additional effect.', idempotent: true },
  props: {
    timezone: mysqlCommon.timezone,
    table: mysqlCommon.table(),
    search_column: Property.ShortText({
      displayName: 'Search Column',
      description: 'The column to match rows on.',
      placeholder: 'id',
      required: true,
      width: 'half',
    }),
    search_value: Property.ShortText({
      displayName: 'Search Value',
      description: 'The value that column must equal.',
      placeholder: '42',
      required: true,
      width: 'half',
    }),
    changes_info: Property.MarkDown({
      value: 'Columns you leave out keep their current value.',
      variant: MarkdownVariant.INFO,
    }),
    values: Property.Object({
      displayName: 'Values',
      description: 'Columns to change and their new values.',
      required: true,
    }),
  },
  propertyGroups: [
    {
      key: 'match',
      display: 'section',
      label: 'Rows to update',
      icon: 'filter',
      props: ['table', 'search_column', 'search_value'],
    },
    {
      key: 'changes',
      display: 'section',
      label: 'Changes',
      icon: 'text',
      props: ['changes_info', 'values'],
    },
  ],
  async run(context) {
    const fields = Object.keys(context.propsValue.values);
    if (fields.length === 0) {
      throw new Error('Values must contain at least one column.');
    }
    const qsValues = fields.map((f) => sanitizeColumnName(f) + '=?').join(',');
    const qs = `UPDATE ${sanitizeColumnName(context.propsValue.table)} SET ${qsValues} WHERE ${sanitizeColumnName(context.propsValue.search_column)}=?;`;
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
