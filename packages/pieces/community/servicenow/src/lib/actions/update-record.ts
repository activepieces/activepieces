import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeServiceNowRequest, servicenowAuth } from '../common/common';


export const updateRecordAction = createAction({
  auth: servicenowAuth,
  name: 'update_record',
  displayName: 'Update Record',
  description: 'Update an existing record\'s fields',
  props: {
    table: Property.ShortText({
      displayName: 'Table Name',
      description: 'The ServiceNow table containing the record',
      required: true,
    }),
    recordId: Property.ShortText({
      displayName: 'Record ID (sys_id)',
      description: 'The sys_id of the record to update',
      required: true,
    }),
    fields: Property.Json({
      displayName: 'Fields to Update',
      description: 'JSON object with field names and new values',
      required: true,
    }),
  },
  async run(context) {
    const table = context.propsValue.table;
    const recordId = context.propsValue.recordId;
    const fields = context.propsValue.fields;

    const response = await makeServiceNowRequest(
      context.auth,
      `/table/${table}/${recordId}`,
      HttpMethod.PATCH,
      fields
    );

    return response.body.result;
  },
});