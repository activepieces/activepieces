import { createAction, Property } from '@activepieces/pieces-framework';
import { airtableCommon } from '../common';
import { airtableAuth } from '../../index';
import { AirtableFindTableRequest } from '../common/models';

export const airtableFindTableAction = createAction({
  auth: airtableAuth,
  name: 'airtable_find_table',
  displayName: 'Find Airtable Table',
  description: 'Finds a table in a base by its name or returns the first table if no name is provided',
  props: {
    baseId: airtableCommon.base,
    tableName: Property.ShortText({
      displayName: 'Table Name',
      description: 'The name of the table to search for (optional)',
      required: false,
    }),
  },
  async run(context) {
    const personalToken = context.auth as string;
    const { baseId, tableName } = context.propsValue;

    const req: AirtableFindTableRequest = {
      personalToken,
      baseId,
      tableName,
    };

    return await airtableCommon.findTable(req);
  },
});
