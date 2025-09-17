import { createAction, Property } from '@activepieces/pieces-framework';
import { airtableCommon } from '../common';
import { airtableAuth } from '../../index';
import { AirtableFindBaseRequest } from '../common/models';

export const airtableFindBaseAction = createAction({
  auth: airtableAuth,
  name: 'airtable_find_base',
  displayName: 'Find Airtable Base',
  description: 'Finds a base by name or keyword',
  props: {
    baseName: Property.ShortText({
      displayName: 'Base Name',
      description: 'The name or keyword of the base to search for',
      required: true,
    }),
  },
  async run(context) {
    const personalToken = context.auth as string;
    const { baseName } = context.propsValue;

    const req: AirtableFindBaseRequest = {
      personalToken,
      baseName,
    };

    return await airtableCommon.findBase(req);
  },
});
