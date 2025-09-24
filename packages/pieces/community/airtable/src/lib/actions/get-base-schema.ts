import { createAction } from '@activepieces/pieces-framework';
import { airtableAuth } from '../../index';
import { airtableCommon } from '../common';

export const airtableGetBaseSchemaAction = createAction({
  auth: airtableAuth,
  name: 'airtable_get_base_schema',
  displayName: 'Get Base Schema',
  description:
    'Retrieve the schema for a specific base, including all its tables and fields.',
  props: {
    base: airtableCommon.base,
  },
  async run(context) {
    const { auth: personalToken, propsValue } = context;
    const { base: baseId } = propsValue;

    return await airtableCommon.fetchTableList({
      token: personalToken,
      baseId: baseId as string,
    });
  },
});