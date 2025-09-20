import { createAction, Property } from '@activepieces/pieces-framework';
import { airtableAuth } from '../../index';
import { airtableCommon } from '../common';
import { AirtableTable } from '../common/models';

export const airtableFindTableAction = createAction({
  auth: airtableAuth,
  name: 'airtable_find_table',
  displayName: 'Find Table',
  description: 'Find a table in a given base by its name.',
  props: {
    base: airtableCommon.base,
    tableName: Property.ShortText({
      displayName: 'Table Name',
      description:
        'The exact name of the table you want to find (case-insensitive).',
      required: true,
    }),
  },
  async run(context) {
    const personalToken = context.auth;
    const { base: baseId, tableName } = context.propsValue;

    if (!baseId) {
      throw new Error('Base not selected. Please select a base.');
    }

    const tables: AirtableTable[] = await airtableCommon.fetchTableList({
      token: personalToken,
      baseId: baseId as string,
    });

    const foundTable = tables.find(
      (table) =>
        table.name.toLowerCase() === (tableName as string).toLowerCase()
    );

    if (!foundTable) {
      return {
        success: false,
        message: `Table "${tableName}" not found in the selected base.`,
        found: false,
      };
    }

    return foundTable;
  },
});
