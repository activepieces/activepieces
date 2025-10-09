import { Property, createAction } from '@activepieces/pieces-framework';
import { querySalesforceApi, salesforcesCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';

export const findRecordsByQuery = createAction({
  auth: salesforceAuth,
  name: 'find_records_by_query',
  displayName: 'Find Records by Query',
  description: 'Finds records using a SOQL WHERE clause in Salesforce',
  props: {
    object: salesforcesCommon.object,
    whereClause: Property.LongText({
      displayName: 'WHERE Clause',
      description: 'SOQL WHERE clause without the WHERE keyword (e.g., Status = \'Open\' AND Priority = \'High\')',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of records to return',
      required: false,
      defaultValue: 200,
    }),
    orderBy: Property.ShortText({
      displayName: 'Order By',
      description: 'Field to order results by (e.g., CreatedDate DESC)',
      required: false,
    }),
  },
  async run(context) {
    const { object, whereClause, limit, orderBy } = context.propsValue;

    const query = `
      SELECT
        FIELDS(ALL)
      FROM
        ${object}
      WHERE ${whereClause}
      ${orderBy ? `ORDER BY ${orderBy}` : ''}
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

