import { Property, createAction } from '@activepieces/pieces-framework';
import { querySalesforceApi, salesforcesCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';

export const findRecord = createAction({
  auth: salesforceAuth,
  name: 'find_record',
  displayName: 'Find Record',
  description: 'Finds a record by searching a specific field in Salesforce',
  props: {
    object: salesforcesCommon.object,
    field: salesforcesCommon.field,
    fieldValue: Property.ShortText({
      displayName: 'Field Value',
      description: 'Value to search for in the specified field',
      required: true,
    }),
  },
  async run(context) {
    const { object, field, fieldValue } = context.propsValue;

    const query = `
      SELECT
        FIELDS(ALL)
      FROM
        ${object}
      WHERE ${field} = '${fieldValue}'
      LIMIT 1
    `;

    const response = await querySalesforceApi(
      HttpMethod.GET,
      context.auth,
      query
    );

    return response.body;
  },
});

