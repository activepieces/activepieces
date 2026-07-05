import { createAction } from '@activepieces/pieces-framework';
import { airtableAuth } from '../auth';
import { airtableCommon } from '../common';

export const airtableGetBaseSchemaAction = createAction({
  auth: airtableAuth,
  name: 'airtable_get_base_schema',
  displayName: 'Get Base Schema',
  description:
    'Retrieve the schema for a specific base, including all its tables and fields.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the full schema of a base — the list of all its tables along with their fields and types. Use to discover what tables and fields a base contains before reading or writing records. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    base: airtableCommon.base,
  },
  async run(context) {
    const { auth: personalToken, propsValue } = context;
    const { base: baseId } = propsValue;

    return await airtableCommon.fetchTableList({
      token: personalToken.secret_text,
      baseId: baseId as string,
    });
  },
});