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
    const personalToken = context.auth;
    const { base: baseId } = context.propsValue;

    if (!baseId) {
      throw new Error('Base must be selected.');
    }

    return await airtableCommon.fetchTableList({
      token: personalToken,
      baseId: baseId as string,
    });
  },
});
