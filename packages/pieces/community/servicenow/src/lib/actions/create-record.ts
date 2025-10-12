import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeServiceNowRequest, servicenowAuth } from '../common/common';

export const createRecordAction = createAction({
  auth: servicenowAuth,
  name: 'create_record',
  displayName: 'Create Record',
  description: 'Create a record in a specified table',
  props: {
    table: Property.ShortText({
      displayName: 'Table Name',
      description: 'The ServiceNow table to create record in (e.g., incident, change_request)',
      required: true,
    }),
  },
  async run(context) {
    const table = context.propsValue.table;

    const response = await makeServiceNowRequest(
      context.auth,
      `/table/${table}`,
      HttpMethod.POST,
    );

    return response.body.result;
  },
});