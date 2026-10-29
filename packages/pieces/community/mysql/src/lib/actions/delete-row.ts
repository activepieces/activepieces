import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { mysqlCommon, mysqlConnect, sanitizeColumnName } from '../common';
import { mysqlAuth } from '../..';
import { deleteRowOutputSchema } from '../output-schemas';

export default createAction({
  auth: mysqlAuth,
  name: 'delete_row',
  displayName: 'Delete Row',
  description: 'Deletes one or more rows from a table',
  audience: 'both',
  outputSchema: deleteRowOutputSchema,
  aiMetadata: { description: 'Deletes every row in a MySQL table whose search column equals a given value. Use to remove records matched by a single column. Idempotent: once the matching rows are gone, re-running with the same input deletes nothing further.', idempotent: true },
  props: {
    markdown: Property.MarkDown({
      value: 'Every matching row is deleted, and this cannot be undone.',
      variant: MarkdownVariant.WARNING,
    }),
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
  },
  propertyGroups: [
    {
      key: 'match',
      display: 'section',
      label: 'Rows to delete',
      icon: 'trash',
      props: ['markdown', 'table', 'search_column', 'search_value'],
    },
  ],
  async run(context) {
    const tableName = sanitizeColumnName(context.propsValue.table);
    const searchColumn = sanitizeColumnName(context.propsValue.search_column);
    const searchValue = context.propsValue.search_value;

    const queryString = `DELETE FROM ${tableName} WHERE ${searchColumn}=?;`;

    const connection = await mysqlConnect(context.auth, context.propsValue);
    try {
      const result = await connection.query(queryString, [searchValue]);
      return result;
    } finally {
      await connection.end();
    }
  },
});
