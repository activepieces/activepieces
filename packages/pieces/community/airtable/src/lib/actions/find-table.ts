import { createAction, Property } from '@activepieces/pieces-framework';
import { airtableAuth } from '../auth';
import { airtableCommon } from '../common';
import { AirtableTable } from '../common/models';

export const airtableFindTableAction = createAction({
  auth: airtableAuth,
  name: 'airtable_find_table',
  displayName: 'Find Table',
  description: 'Find a table in a given base by its name.',
  audience: 'both',
  aiMetadata: {
    description:
      'Looks up a single table in a base by an exact (case-insensitive) name match and returns it, or null if no table matches. Use to resolve a table ID from its name. Read-only and idempotent.',
    idempotent: true,
  },
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

    const tables: AirtableTable[] = await airtableCommon.fetchTableList({
      token: personalToken.secret_text,
      baseId: baseId as string,
    });

    const foundTable = tables.find(
      (table) =>
        table.name.toLowerCase() === (tableName as string).toLowerCase()
    );


    return foundTable ?? null;
  },
});