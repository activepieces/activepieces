import { Property, createAction } from '@activepieces/pieces-framework';
import { querySalesforceApi, salesforcesCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';

export const findChildRecords = createAction({
  auth: salesforceAuth,
  name: 'find_child_records',
  displayName: 'Find Child Records',
  description: 'Finds child records for a given parent record in Salesforce',
  props: {
    childObject: salesforcesCommon.object,
    parentField: Property.ShortText({
      displayName: 'Parent Field Name',
      description: 'Name of the field that references the parent (e.g., AccountId, ContactId)',
      required: true,
    }),
    parentId: Property.ShortText({
      displayName: 'Parent ID',
      description: 'ID of the parent record',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of records to return',
      required: false,
      defaultValue: 200,
    }),
  },
  async run(context) {
    const { childObject, parentField, parentId, limit } = context.propsValue;

    const query = `
      SELECT
        FIELDS(ALL)
      FROM
        ${childObject}
      WHERE ${parentField} = '${parentId}'
      LIMIT ${limit ?? 200}
    `;

    const response = await querySalesforceApi(
      HttpMethod.GET,
      context.auth,
      query
    );

    return response.body;
  },
});

