import { createAction, Property } from '@activepieces/pieces-framework';
import { airtableAuth } from '../../index';
import { airtableCommon } from '../common';
import { AirtableBase } from '../common/models';

export const airtableFindBaseAction = createAction({
  auth: airtableAuth,
  name: 'airtable_find_base',
  displayName: 'Find Base',
  description: 'Find a base by its name or a keyword.',
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
      token: personalToken,
    });

    const searchTerm = (baseName as string).toLowerCase();


    const foundBases = allBases.filter((base) =>
      base.name.toLowerCase().includes(searchTerm)
    );

    return foundBases;
  },
});