import { createAction, Property } from '@activepieces/pieces-framework';
import { makeServiceNowRequest, servicenowAuth } from '../common/common';


export const getRecordAction = createAction({
  auth: servicenowAuth,
  name: 'get_record',
  displayName: 'Get Record',
  description: 'Fetch a specific record by ID',
  props: {
    table: Property.ShortText({
      displayName: 'Table Name',
      description: 'The ServiceNow table',
      required: true,
    }),
    recordId: Property.ShortText({
      displayName: 'Record ID (sys_id)',
      description: 'The sys_id of the record to retrieve',
      required: true,
    }),
  },
  async run(context) {
    const table = context.propsValue.table;
    const recordId = context.propsValue.recordId;

    const response = await makeServiceNowRequest(
      context.auth,
      `/table/${table}/${recordId}?sysparm_exclude_reference_link=true`
    );

    return response.body.result;
  },
});