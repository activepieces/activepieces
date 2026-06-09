import { createAction, Property } from '@activepieces/pieces-framework';
import { airtableAuth } from '../auth';
import { airtableCommon } from '../common';
import { AirtableBase } from '../common/models';

export const airtableFindBaseAction = createAction({
  auth: airtableAuth,
  name: 'airtable_find_base',
  displayName: 'Find Base',
  description: 'Find a base by its name or a keyword.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists all accessible bases and returns those whose name contains the given keyword (case-insensitive substring match). Use to resolve a base ID from a name before other operations. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    baseName: Property.ShortText({
      displayName: 'Base Name or Keyword',
      description: 'The name or keyword to search for within your base names.',
      required: true,
    }),
  },
  async run(context) {
    const { auth: personalToken, propsValue } = context;
    const { baseName } = propsValue;

    const allBases: AirtableBase[] = await airtableCommon.fetchAllBases({
      token: personalToken.secret_text,
    });

    const searchTerm = (baseName as string).toLowerCase();


    const foundBases = allBases.filter((base) =>
      base.name.toLowerCase().includes(searchTerm)
    );

    return foundBases;
  },
});