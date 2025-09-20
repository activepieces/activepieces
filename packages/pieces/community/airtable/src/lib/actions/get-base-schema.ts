import { createAction, Property } from '@activepieces/pieces-framework';
import { airtableCommon } from '../common';
import { airtableAuth } from '../../index';
import { AirtableGetBaseSchemaRequest } from '../common/models';

export const airtableGetBaseSchemaAction = createAction({
  auth: airtableAuth,
  name: 'airtable_get_base_schema',
  displayName: 'Get Base Schema',
  description: 'Retrieves the schema (tables, fields, and types) for a base',
  props: {
    baseId: airtableCommon.base
  },
  async run(context) {
    const personalToken = context.auth as string;
    const { baseId } = context.propsValue;

    const req: AirtableGetBaseSchemaRequest = {
      personalToken,
      baseId: baseId as string,
    };

    return await airtableCommon.getBaseSchema(req);
  },
});
