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
      description: 'The exact name of the table you want to find.',
      required: true,
    }),
  },
  async run(context) {
    const { auth: personalToken, propsValue } = context;
    const { base: baseId, tableName } = propsValue;

    // The fetchTableList function gets all tables for the specified base
    const tables: AirtableTable[] = await airtableCommon.fetchTableList({
      token: personalToken,
      baseId: baseId as string,
    });

    // We search through the returned tables for a case-insensitive name match
    const foundTable = tables.find(
      (table) =>
        table.name.toLowerCase() === (tableName as string).toLowerCase()
    );

    // If no table is found, this will return null
    return foundTable ?? null;
  },
});